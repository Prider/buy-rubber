import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteExpiredPendingSignups } from '../pendingSignupCleanup';

vi.mock('@/platform/prisma', () => ({
  prisma: {
    pendingSignup: { deleteMany: vi.fn() },
  },
}));

vi.mock('@/shared/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('deleteExpiredPendingSignups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes rows whose code has expired', async () => {
    const prisma = (await import('@/platform/prisma')).prisma as {
      pendingSignup: { deleteMany: ReturnType<typeof vi.fn> };
    };
    vi.mocked(prisma.pendingSignup.deleteMany).mockResolvedValue({ count: 3 });
    const now = new Date('2026-09-24T09:00:00.000Z');

    await expect(deleteExpiredPendingSignups(now)).resolves.toBe(3);
    expect(prisma.pendingSignup.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: now } },
    });
  });
});
