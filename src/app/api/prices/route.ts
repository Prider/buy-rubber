import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prices - ดึงราคาประกาศ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const locationId = searchParams.get('locationId');

    const where: any = {};

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      where.date = targetDate;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const prices = await prisma.dailyPrice.findMany({
      where,
      include: {
        location: true,
        priceRules: {
          orderBy: { minPercent: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Get prices error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลราคา' },
      { status: 500 }
    );
  }
}

// POST /api/prices - สร้างราคาประกาศใหม่
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // ตรวจสอบว่ามีราคาประกาศวันนี้แล้วหรือไม่
    const existing = await prisma.dailyPrice.findFirst({
      where: {
        date,
        locationId: data.locationId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'มีราคาประกาศสำหรับวันนี้แล้ว' },
        { status: 400 }
      );
    }

    // สร้างราคาประกาศพร้อมกฎการปรับราคา
    const dailyPrice = await prisma.dailyPrice.create({
      data: {
        date,
        locationId: data.locationId,
        basePrice: data.basePrice,
        priceRules: {
          create: data.priceRules || [],
        },
      },
      include: {
        location: true,
        priceRules: true,
      },
    });

    return NextResponse.json(dailyPrice, { status: 201 });
  } catch (error) {
    console.error('Create price error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างราคาประกาศ' },
      { status: 500 }
    );
  }
}

