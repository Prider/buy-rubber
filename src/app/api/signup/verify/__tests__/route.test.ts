import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { resetRateLimits } from '@/lib/rateLimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pendingSignup: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    tenant: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/provisionTenant', () => ({
  provisionTenant: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  generateToken: vi.fn(() => 'session-token'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const code = '1234';
const tokenHash = createHash('sha256').update(`my-shop:${code}`).digest('hex');

const pending = {
  id: 'pending-1',
  slug: 'my-shop',
  username: 'owner',
  passwordHash: 'hashed-password',
  email: 'owner@shop.com',
  companyName: 'ร้านทดสอบ',
  companyAddress: 'ที่อยู่',
  plan: 'freemium',
  tokenHash,
  failedAttempts: 0,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
};

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/signup/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/signup/verify', () => {
  let prisma: {
    pendingSignup: {
      findUnique: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    tenant: { findUnique: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let provisionTenant: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resetRateLimits();
    vi.clearAllMocks();
    prisma = (await import('@/lib/prisma')).prisma as never;
    provisionTenant = (await import('@/lib/provisionTenant')).provisionTenant as never;
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(pending);
    vi.mocked(prisma.pendingSignup.delete).mockResolvedValue(pending);
    vi.mocked(prisma.pendingSignup.update).mockResolvedValue({ failedAttempts: 1 });
    vi.mocked(prisma.pendingSignup.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma));
    vi.mocked(provisionTenant).mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        slug: 'my-shop',
        plan: 'freemium',
        status: 'active',
      },
      user: {
        id: 'user-1',
        username: 'owner',
        role: 'admin',
        password: 'hashed-password',
      },
    });
  });

  it('creates the shop and returns a session for a freemium signup', async () => {
    const response = await POST(request({ slug: 'my-shop', code }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('session-token');
    expect(data.next).toBe('/dashboard');
    expect(data.user.password).toBeUndefined();
    expect(prisma.pendingSignup.deleteMany).toHaveBeenCalledWith({
      where: { id: 'pending-1', tokenHash },
    });
    expect(provisionTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'my-shop',
        adminPassword: 'hashed-password',
        passwordAlreadyHashed: true,
        status: 'active',
        plan: 'freemium',
      }),
      prisma,
    );
  });

  it('sends a premium signup to payment after verification', async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue({ ...pending, plan: 'premium' });
    vi.mocked(provisionTenant).mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'my-shop', plan: 'premium', status: 'not_yet_payment' },
      user: { id: 'user-1', username: 'owner', role: 'admin', password: 'hashed-password' },
    });

    const response = await POST(request({ slug: 'my-shop', code }));
    const data = await response.json();

    expect(data.next).toBe('/signup/payment');
    expect(provisionTenant).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'not_yet_payment', plan: 'premium' }),
      prisma,
    );
  });

  it('rejects an expired link and does not create a shop', async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue({
      ...pending,
      expiresAt: new Date(Date.now() - 1000),
    });

    const response = await POST(request({ slug: 'my-shop', code }));

    expect(response.status).toBe(400);
    expect(provisionTenant).not.toHaveBeenCalled();
    expect(prisma.pendingSignup.delete).toHaveBeenCalledWith({ where: { id: 'pending-1' } });
  });

  it('counts a wrong code and stops after five misses', async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue({
      ...pending,
      failedAttempts: 4,
    });
    vi.mocked(prisma.pendingSignup.update).mockResolvedValue({ failedAttempts: 5 });

    const response = await POST(request({ slug: 'my-shop', code: '0000' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('สมัครใหม่');
    expect(prisma.pendingSignup.update).toHaveBeenCalledWith({
      where: { id: 'pending-1' },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });
    expect(prisma.pendingSignup.delete).toHaveBeenCalledWith({ where: { id: 'pending-1' } });
    expect(provisionTenant).not.toHaveBeenCalled();
  });

  it('rejects a token that was already used', async () => {
    vi.mocked(prisma.pendingSignup.deleteMany).mockResolvedValue({ count: 0 });

    const response = await POST(request({ slug: 'my-shop', code }));

    expect(response.status).toBe(400);
    expect(provisionTenant).not.toHaveBeenCalled();
  });
});
