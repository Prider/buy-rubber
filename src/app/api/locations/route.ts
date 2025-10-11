import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/locations
export async function GET(request: NextRequest) {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโรงรับซื้อ' },
      { status: 500 }
    );
  }
}

