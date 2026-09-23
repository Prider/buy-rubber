import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: { update: vi.fn() },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const rawToken = 'abc123token';
const tokenHash = createHash('sha256').update(rawToken).digest('hex');

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/reset-password', () => {
  let prisma: {
    passwordResetToken: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    user: { update: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import('@/lib/prisma')).prisma as never;
    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'admin-1' });
    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({ id: 'reset-1' });
  });

  it('rejects a missing token', async () => {
    const response = await POST(request({ password: 'newpass' }));
    expect(response.status).toBe(400);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a short password', async () => {
    const response = await POST(request({ token: rawToken, password: '123' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  });

  it('rejects an unknown token', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);

    const response = await POST(request({ token: rawToken, password: 'newpass' }));
    expect(response.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'reset-1',
      userId: 'admin-1',
      tokenHash,
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });

    const response = await POST(request({ token: rawToken, password: 'newpass' }));
    expect(response.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects a used token', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'reset-1',
      userId: 'admin-1',
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });

    const response = await POST(request({ token: rawToken, password: 'newpass' }));
    expect(response.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('updates the password and marks the token used', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'reset-1',
      userId: 'admin-1',
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });

    const response = await POST(request({ token: rawToken, password: 'newpass' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'admin-1' },
      data: { password: expect.stringMatching(/^\$2[aby]\$/) },
    });
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
      data: { usedAt: expect.any(Date) },
    });
  });
});
