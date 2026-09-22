import { NextRequest, NextResponse } from 'next/server';
import { resetToInitialData } from '@/lib/backup';
import { logger } from '@/lib/logger';
import { requireTenantAuth } from '@/lib/tenant';

export const runtime = 'nodejs';

// POST /api/backup/reset - รีเซ็ตข้อมูลกลับสู่สถานะเริ่มต้น
export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const result = await resetToInitialData(tenantId);

    if (result.success) {
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  } catch (error: unknown) {
    logger.error('Failed to reset to initial data', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูลเริ่มต้น' },
      { status: 500 }
    );
  }
}
