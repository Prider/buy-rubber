import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prices/history?days=10 - Get price history for the last N days
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '10');

    // Calculate the date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const prices = await prisma.productPrice.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        productType: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Get price history error:', error);
    return NextResponse.json(
      { error: 'Failed to load price history' },
      { status: 500 }
    );
  }
}

