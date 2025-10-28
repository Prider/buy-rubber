import { NextRequest, NextResponse } from 'next/server';
import { createBackup, getBackupList, restoreBackup, deleteBackup } from '@/lib/backup';
import fs from 'fs';
import path from 'path';

// GET /api/backup - ดึงรายการสำรองข้อมูล
export async function GET() {
  try {
    const backups = await getBackupList();
    return NextResponse.json({ backups });
  } catch (error: any) {
    console.error('Get backup list error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงรายการสำรองข้อมูล' },
      { status: 500 }
    );
  }
}

// POST /api/backup - สร้างสำรองข้อมูล
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json().catch(() => ({}));
    const result = await createBackup(type || 'manual');

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Create backup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสำรองข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT /api/backup - เรียกคืนข้อมูล
export async function PUT(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของการสำรองข้อมูล' },
        { status: 400 }
      );
    }

    const result = await restoreBackup(id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Restore backup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเรียกคืนข้อมูล' },
      { status: 500 }
    );
  }
}

// DELETE /api/backup - ลบไฟล์สำรอง
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID ของการสำรองข้อมูล' },
        { status: 400 }
      );
    }

    const result = await deleteBackup(id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Delete backup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูล' },
      { status: 500 }
    );
  }
}

