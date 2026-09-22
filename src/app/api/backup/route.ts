import { NextRequest, NextResponse } from 'next/server';
import { createBackup, getBackupList, restoreBackup, deleteBackup } from '@/lib/backup';
import { logger } from '@/lib/logger';
import { requireTenantAuth } from '@/lib/tenant';

// Force Node.js runtime for file system operations
export const runtime = 'nodejs';

// GET /api/backup - ดึงรายการสำรองข้อมูล
export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const backups = await getBackupList(tenantId);
    return NextResponse.json({ backups });
  } catch (error: any) {
    logger.error('Failed to get backup list', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงรายการสำรองข้อมูล' },
      { status: 500 }
    );
  }
}

// POST /api/backup - สร้างสำรองข้อมูล
export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const { type } = await request.json().catch(() => ({}));
    const result = await createBackup(type || 'manual', tenantId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to create backup', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสำรองข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT /api/backup - เรียกคืนข้อมูล
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของการสำรองข้อมูล' },
        { status: 400 }
      );
    }

    const result = await restoreBackup(id, tenantId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to restore backup', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเรียกคืนข้อมูล' },
      { status: 500 }
    );
  }
}

// DELETE /api/backup - ลบไฟล์สำรอง
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของการสำรองข้อมูล' },
        { status: 400 }
      );
    }

    const result = await deleteBackup(id, tenantId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to delete backup', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูล' },
      { status: 500 }
    );
  }
}

