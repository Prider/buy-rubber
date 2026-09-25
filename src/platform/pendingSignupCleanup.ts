import cron from 'node-cron';
import { prisma } from '@/platform/prisma';
import { logger } from '@/shared/logger';

const globalForCleanup = globalThis as typeof globalThis & {
  pendingSignupCleanupStarted?: boolean;
};

export async function deleteExpiredPendingSignups(now = new Date()): Promise<number> {
  const result = await prisma.pendingSignup.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}

export function startPendingSignupCleanup(): void {
  if (globalForCleanup.pendingSignupCleanupStarted) return;
  if (process.env.NODE_ENV === 'test') return;
  globalForCleanup.pendingSignupCleanupStarted = true;

  const run = () => {
    void deleteExpiredPendingSignups().catch((error) => {
      logger.error('Failed to delete expired pending signups', error);
    });
  };

  run();
  cron.schedule('*/15 * * * *', run);
}
