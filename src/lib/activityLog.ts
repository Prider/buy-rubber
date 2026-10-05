import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';
import { activityRetentionCutoff, type ActivityAction, type ActivityEntityType } from '@/lib/activityLogShared';

export type ActivityActor = {
  userId: string;
  username: string;
  role: string;
};

export type ActivityChanges = Record<string, unknown>;

type ActivityCreateData = {
  userId: string;
  username: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  summary: string;
  changes: string | null;
};

type ActivityDelegate = {
  create?(args: { data: ActivityCreateData }): Promise<unknown>;
  deleteMany?(args: { where: { createdAt: { lt: Date } } }): Promise<unknown>;
};

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
let lastPurgeAt = 0;
let purgePromise: Promise<void> | null = null;

export function getActivityActor(request: NextRequest): ActivityActor | null {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const user = getVerifiedUserFromToken(token);
  if (!user?.userId) {
    return null;
  }

  return {
    userId: user.userId,
    username: user.username || 'Unknown',
    role: user.role || 'user',
  };
}

function activityDelegate(db: object): ActivityDelegate | null {
  const delegate = (db as { activityLog?: ActivityDelegate }).activityLog;
  return delegate ?? null;
}

export async function recordActivity(
  db: object,
  input: {
    actor: ActivityActor | null;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId: string;
    entityLabel?: string | null;
    summary: string;
    changes?: ActivityChanges | null;
  },
): Promise<void> {
  if (!input.actor?.userId) {
    logger.warn('recordActivity skipped: no signed-in user', {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
    });
    return;
  }

  if (input.action === 'update' && (!input.changes || Object.keys(input.changes).length === 0)) {
    return;
  }

  const create = activityDelegate(db)?.create;
  if (typeof create !== 'function') {
    return;
  }

  try {
    await create({
      data: {
        userId: input.actor.userId,
        username: input.actor.username,
        role: input.actor.role,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? null,
        summary: input.summary,
        changes: input.changes ? JSON.stringify(input.changes) : null,
      },
    });
  } catch (error) {
    logger.error('recordActivity failed', error);
  }
}

export function resetActivityPurgeClock(): void {
  lastPurgeAt = 0;
  purgePromise = null;
}

/** Drops rows older than 90 days. Runs at most once per process per day. */
export async function purgeExpiredActivityLogs(db: object = prisma, now = new Date()): Promise<void> {
  const deleteMany = activityDelegate(db)?.deleteMany;
  if (typeof deleteMany !== 'function') {
    return;
  }

  if (now.getTime() - lastPurgeAt < PURGE_INTERVAL_MS) {
    return;
  }

  if (purgePromise) {
    return purgePromise;
  }

  purgePromise = (async () => {
    try {
      await deleteMany({
        where: { createdAt: { lt: activityRetentionCutoff(now) } },
      });
      lastPurgeAt = Date.now();
    } catch (error) {
      logger.error('purgeExpiredActivityLogs failed', error);
    } finally {
      purgePromise = null;
    }
  })();

  return purgePromise;
}
