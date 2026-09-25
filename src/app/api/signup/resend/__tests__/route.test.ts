import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { resetRateLimits } from '@/platform/rateLimit';

vi.mock('@/platform/prisma', () => ({
  prisma: {
    pendingSignup: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/platform/mail', () => ({
  sendSignupVerificationEmail: vi.fn(),
}));

vi.mock('@/shared/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const pending = {
  id: 'pending-1',
  slug: 'my-shop',
  email: 'owner@shop.com',
  companyName: 'ร้านทดสอบ',
  tokenHash: 'old-hash',
  failedAttempts: 2,
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  sentAt: new Date(Date.now() - 5 * 60 * 1000),
};

function request(payload: unknown) {
  return new NextRequest('http://localhost:3000/api/signup/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

describe('POST /api/signup/resend', () => {
  let prisma: {
    pendingSignup: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
  let sendSignupVerificationEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resetRateLimits();
    vi.clearAllMocks();
    prisma = (await import('@/platform/prisma')).prisma as never;
    sendSignupVerificationEmail = (await import('@/platform/mail')).sendSignupVerificationEmail as never;
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue(pending);
    vi.mocked(prisma.pendingSignup.update).mockResolvedValue(pending);
    vi.mocked(sendSignupVerificationEmail).mockResolvedValue(undefined);
  });

  it('rotates the code and emails the new digits', async () => {
    const response = await POST(request({ slug: 'my-shop', email: 'owner@shop.com' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cooldownSeconds).toBe(60);

    const code = vi.mocked(sendSignupVerificationEmail).mock.calls[0][0].code as string;
    const tokenHash = createHash('sha256').update(`my-shop:${code}`).digest('hex');
    expect(code).toMatch(/^\d{4}$/);
    expect(prisma.pendingSignup.update).toHaveBeenCalledWith({
      where: { id: 'pending-1' },
      data: expect.objectContaining({ tokenHash, failedAttempts: 0 }),
    });
    expect(tokenHash).not.toBe('old-hash');
  });

  it('rejects a resend inside the cooldown', async () => {
    vi.mocked(prisma.pendingSignup.findUnique).mockResolvedValue({
      ...pending,
      sentAt: new Date(),
    });

    const response = await POST(request({ slug: 'my-shop', email: 'owner@shop.com' }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.retryAfterSeconds).toBeGreaterThan(0);
    expect(sendSignupVerificationEmail).not.toHaveBeenCalled();
  });

  it('restores the previous token when sending fails', async () => {
    vi.mocked(sendSignupVerificationEmail).mockRejectedValue(new Error('smtp down'));

    const response = await POST(request({ slug: 'my-shop', email: 'owner@shop.com' }));

    expect(response.status).toBe(500);
    expect(prisma.pendingSignup.update).toHaveBeenLastCalledWith({
      where: { id: 'pending-1' },
      data: {
        tokenHash: 'old-hash',
        expiresAt: pending.expiresAt,
        sentAt: pending.sentAt,
        failedAttempts: 2,
      },
    });
  });
});
