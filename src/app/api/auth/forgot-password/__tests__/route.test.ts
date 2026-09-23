import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findMany: vi.fn() },
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/mail', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const shop = {
  id: 'tenant-1',
  slug: 'my-shop',
  name: 'ร้านทดสอบ',
  users: [
    {
      id: 'root-1',
      username: 'root',
      role: 'root',
      createdAt: new Date('2020-01-01'),
      isActive: true,
    },
    {
      id: 'admin-1',
      username: 'owner',
      role: 'admin',
      createdAt: new Date('2024-01-01'),
      isActive: true,
    },
  ],
};

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  let prisma: {
    tenant: { findMany: ReturnType<typeof vi.fn> };
    passwordResetToken: {
      updateMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
  let sendPasswordResetEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import('@/lib/prisma')).prisma as never;
    sendPasswordResetEmail = (await import('@/lib/mail')).sendPasswordResetEmail as never;
    vi.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({ id: 'token-1' });
    vi.mocked(prisma.passwordResetToken.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);
  });

  it('rejects an invalid email', async () => {
    const response = await POST(request({ email: 'not-an-email' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(prisma.tenant.findMany).not.toHaveBeenCalled();
  });

  it('returns a generic success when the email is unknown', async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([]);

    const response = await POST(request({ email: 'missing@shop.com' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('emails a reset link for the oldest admin of a single shop', async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([shop]);

    const response = await POST(request({ email: 'Owner@Shop.com' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'owner@shop.com' } }),
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@shop.com',
        shopName: 'ร้านทดสอบ',
        username: 'owner',
      }),
    );

    const resetUrl = vi.mocked(sendPasswordResetEmail).mock.calls[0][0].resetUrl as string;
    const token = new URL(resetUrl).searchParams.get('token');
    const tokenHash = createHash('sha256').update(token || '').digest('hex');
    expect(resetUrl).toContain('/reset-password?token=');
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        tokenHash,
      }),
    });
  });

  it('asks for a shop code when several shops share the email', async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([
      shop,
      { ...shop, id: 'tenant-2', slug: 'other-shop' },
    ]);

    const response = await POST(request({ email: 'owner@shop.com' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.needsSlug).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends the reset for the shop code when several shops share the email', async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([
      shop,
      {
        ...shop,
        id: 'tenant-2',
        slug: 'other-shop',
        name: 'ร้านอื่น',
        users: [{ ...shop.users[1], id: 'admin-2', username: 'other' }],
      },
    ]);

    const response = await POST(request({ email: 'owner@shop.com', slug: 'other-shop' }));

    expect(response.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ shopName: 'ร้านอื่น', username: 'other' }),
    );
  });

  it('does not reveal a shop that has no admin user', async () => {
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([{ ...shop, users: [] }]);

    const response = await POST(request({ email: 'owner@shop.com' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
