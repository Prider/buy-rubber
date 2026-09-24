import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { SIGNUP_RATE_LIMIT, resetRateLimits } from '@/lib/rateLimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findUnique: vi.fn() },
    pendingSignup: {
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(async () => 'hashed-password'),
}));

vi.mock('@/lib/mail', () => ({
  sendSignupVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const body = {
  plan: 'freemium',
  slug: 'my-shop',
  username: 'owner',
  password: 'secret1',
  email: 'Owner@Shop.com',
  companyName: 'ร้านทดสอบ',
  companyAddress: 'ที่อยู่',
};

function request(payload: unknown) {
  return new NextRequest('http://localhost:3000/api/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

describe('POST /api/signup', () => {
  let prisma: {
    tenant: { findUnique: ReturnType<typeof vi.fn> };
    pendingSignup: {
      deleteMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
  let sendSignupVerificationEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resetRateLimits();
    vi.clearAllMocks();
    prisma = (await import('@/lib/prisma')).prisma as never;
    sendSignupVerificationEmail = (await import('@/lib/mail')).sendSignupVerificationEmail as never;
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pendingSignup.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pendingSignup.create).mockResolvedValue({ id: 'pending-1' });
    vi.mocked(prisma.pendingSignup.delete).mockResolvedValue({ id: 'pending-1' });
    vi.mocked(sendSignupVerificationEmail).mockResolvedValue(undefined);
  });

  it('stores a pending signup and emails a one-time link without a session', async () => {
    const response = await POST(request(body));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.token).toBeUndefined();
    expect(data.email).toBe('owner@shop.com');
    expect(data.cooldownSeconds).toBe(60);
    expect(prisma.pendingSignup.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'my-shop',
        username: 'owner',
        passwordHash: 'hashed-password',
        email: 'owner@shop.com',
        companyName: 'ร้านทดสอบ',
        plan: 'freemium',
      }),
    });

    const code = vi.mocked(sendSignupVerificationEmail).mock.calls[0][0].code as string;
    const tokenHash = createHash('sha256').update(`my-shop:${code}`).digest('hex');
    expect(code).toMatch(/^\d{4}$/);
    expect(prisma.pendingSignup.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tokenHash, failedAttempts: 0 }),
    });
  });

  it('rejects a slug that already belongs to a shop', async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ id: 'tenant-1' });

    const response = await POST(request(body));
    expect(response.status).toBe(409);
    expect(prisma.pendingSignup.create).not.toHaveBeenCalled();
  });

  it('deletes the pending signup when the email fails', async () => {
    vi.mocked(sendSignupVerificationEmail).mockRejectedValue(new Error('smtp down'));

    const response = await POST(request(body));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(prisma.pendingSignup.delete).toHaveBeenCalledWith({ where: { id: 'pending-1' } });
  });

  it('returns a conflict when the slug is claimed between the check and the insert', async () => {
    vi.mocked(prisma.pendingSignup.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['slug'] },
      }),
    );

    const response = await POST(request(body));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toBe('รหัสร้านนี้ถูกใช้แล้ว');
  });

  it('stops accepting signups from the same address after the limit', async () => {
    for (let i = 0; i < SIGNUP_RATE_LIMIT.limit; i += 1) {
      const allowed = await POST(request(body));
      expect(allowed.status).toBe(201);
    }

    const blocked = await POST(request(body));
    const data = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(data.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.headers.get('Retry-After')).toBe(String(data.retryAfterSeconds));
  });
});
