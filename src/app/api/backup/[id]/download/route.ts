import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

// GET /api/backup/[id]/download - ดาวน์โหลดไฟล์สำรอง
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // ดึงข้อมูลการสำรอง
    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการสำรอง' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าไฟล์มีอยู่
    if (!fs.existsSync(backup.filePath)) {
      return NextResponse.json(
        { error: 'ไฟล์สำรองไม่พบ' },
        { status: 404 }
      );
    }

    // อ่านไฟล์
    const fileBuffer = fs.readFileSync(backup.filePath);
    const stats = fs.statSync(backup.filePath);

    // ส่งไฟล์ให้ดาวน์โหลด
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backup.fileName}"`,
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download backup error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์' },
      { status: 500 }
    );
  }
}

