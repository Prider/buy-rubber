import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/prices/daily - Get prices for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    let targetDate;
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }
    
    // Set to start of day to avoid timezone issues
    targetDate.setHours(0, 0, 0, 0);
    
    console.log('[Daily Price API GET] Fetching prices for date:', targetDate.toISOString());
    
    const prices = await prisma.productPrice.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000), // Next day
        },
      },
      include: {
        productType: true,
      },
      orderBy: {
        productType: {
          name: 'asc',
        },
      },
    });
    
    console.log('[Daily Price API GET] Found prices:', prices.length, prices);
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('[Daily Price API GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily prices', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/prices/daily - Set prices for a specific date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, prices } = body;

    console.log('[Daily Price API] Received request:', { date, prices });

    if (!date || !prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: 'Date and prices array are required' },
        { status: 400 }
      );
    }

    // Create date at noon to avoid timezone issues
    const priceDate = new Date(date);
    priceDate.setHours(12, 0, 0, 0);

    console.log('[Daily Price API] Processing date:', {
      inputDate: date,
      parsedDate: priceDate.toISOString(),
      localDate: priceDate.toLocaleDateString(),
    });

    // Delete existing prices for this date (if any)
    const deletedCount = await prisma.productPrice.deleteMany({
      where: {
        date: {
          gte: new Date(date + 'T00:00:00'),
          lte: new Date(date + 'T23:59:59'),
        },
      },
    });

    console.log('[Daily Price API] Deleted existing prices:', deletedCount.count);

    // Filter valid prices
    const validPrices = prices.filter(p => p.price > 0);
    console.log('[Daily Price API] Valid prices to create:', validPrices.length, validPrices);

    // Create new price records
    const createdPrices = await Promise.all(
      validPrices.map(async (p) => {
        const created = await prisma.productPrice.create({
          data: {
            date: priceDate,
            productTypeId: p.productTypeId,
            price: p.price,
          },
        });
        console.log('[Daily Price API] Created price:', {
          id: created.id,
          date: created.date.toISOString(),
          productTypeId: created.productTypeId,
          price: created.price,
        });
        return created;
      })
    );

    console.log('[Daily Price API] Successfully created:', createdPrices.length, 'prices');

    return NextResponse.json({
      success: true,
      count: createdPrices.length,
      prices: createdPrices,
    }, { status: 201 });
  } catch (error) {
    console.error('[Daily Price API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save daily prices', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

