import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyAdminRole } from '@/lib/sessionToken';
import { purgeExpiredActivityLogs } from '@/lib/activityLog';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_LOG_RETENTION_DAYS,
  activityRetentionCutoff,
} from '@/lib/activityLogShared';

export const runtime = 'nodejs';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

// GET /api/activity — admin activity history for edits and deletes (last 90 days)
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminRole(request)) {
      return NextResponse.json({ error: 'ต้องเป็นผู้ดูแลระบบ' }, { status: 403 });
    }

    await purgeExpiredActivityLogs(prisma);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAX,
      Math.max(1, Number(searchParams.get('pageSize')) || PAGE_SIZE_DEFAULT),
    );
    const userId = searchParams.get('userId')?.trim() || undefined;
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType')?.trim() || undefined;

    const where = {
      createdAt: { gte: activityRetentionCutoff() },
      ...(userId ? { userId } : {}),
      ...(ACTIVITY_ACTIONS.includes(action as (typeof ACTIVITY_ACTIONS)[number]) ? { action } : {}),
      ...(entityType ? { entityType } : {}),
    };

    const activityLog = (
      prisma as unknown as {
        activityLog: {
          count(args: { where: typeof where }): Promise<number>;
          findMany(args: unknown): Promise<unknown[]>;
        };
      }
    ).activityLog;

    const [total, items] = await Promise.all([
      activityLog.count({ where }),
      activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      retentionDays: ACTIVITY_LOG_RETENTION_DAYS,
    });
  } catch (error) {
    logger.error('GET /api/activity failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งาน' }, { status: 500 });
  }
}
