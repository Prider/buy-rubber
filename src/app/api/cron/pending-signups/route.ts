import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/shared/logger';
import { deleteExpiredPendingSignups } from '@/platform/pendingSignupCleanup';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const deleted = await deleteExpiredPendingSignups();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    logger.error('Failed to delete expired pending signups', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
