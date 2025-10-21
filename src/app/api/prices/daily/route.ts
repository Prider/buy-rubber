import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/prices/daily - Set prices for a specific date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, prices } = body;

    if (!date || !prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'Date and prices array are required' },
        { status: 400 }
      );
    }

    const priceDate = new Date(date);
    priceDate.setHours(0, 0, 0, 0);

    // Delete existing prices for this date (if any)
    await prisma.productPrice.deleteMany({
      where: {
        date: priceDate,
      },
    });

    // Create new price records
    const createdPrices = await Promise.all(
      prices
        .filter(p => p.price > 0) // Only create records with valid prices
        .map(p =>
          prisma.productPrice.create({
            data: {
              date: priceDate,
              productTypeId: p.productTypeId,
              price: p.price,
            },
          })
        )
    );

    return NextResponse.json({
      success: true,
      count: createdPrices.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Create daily prices error:', error);
    return NextResponse.json(
      { error: 'Failed to save daily prices' },
      { status: 500 }
    );
  }
}

