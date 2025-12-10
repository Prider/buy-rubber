import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS } from '@/lib/cache';

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
    
    logger.info('GET /api/prices/daily', { date: targetDate.toISOString().split('T')[0] });
    
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
    
    logger.info('GET /api/prices/daily - Success', { count: prices.length });
    
    return NextResponse.json(prices);
  } catch (error) {
    logger.error('GET /api/prices/daily - Failed', error);
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

    logger.info('POST /api/prices/daily', { date, priceCount: prices?.length });

    if (!date || !prices || !Array.isArray(prices)) {
      logger.warn('POST /api/prices/daily - Invalid request');
      return NextResponse.json(
        { error: 'Date and prices array are required' },
        { status: 400 }
      );
    }

    // Create date at noon to avoid timezone issues
    const priceDate = new Date(date);
    priceDate.setHours(12, 0, 0, 0);

    // Delete existing prices for this date (if any)
    const deletedCount = await prisma.productPrice.deleteMany({
      where: {
        date: {
          gte: new Date(date + 'T00:00:00'),
          lte: new Date(date + 'T23:59:59'),
        },
      },
    });

    logger.debug('Deleted existing prices', { count: deletedCount.count });

    // Filter valid prices
    const validPrices = prices.filter(p => p.price > 0);

    // Create new price records
    const createdPrices = await Promise.all(
      validPrices.map(async (p) => {
        return await prisma.productPrice.create({
          data: {
            date: priceDate,
            productTypeId: p.productTypeId,
            price: p.price,
          },
        });
      })
    );

    // Invalidate dashboard cache when prices are updated (dashboard shows today's prices)
    cache.delete(CACHE_KEYS.DASHBOARD);

    logger.info('POST /api/prices/daily - Success', { count: createdPrices.length });

    return NextResponse.json({
      success: true,
      count: createdPrices.length,
      prices: createdPrices,
    }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/prices/daily - Failed', error);
    return NextResponse.json(
      { error: 'Failed to save daily prices', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

