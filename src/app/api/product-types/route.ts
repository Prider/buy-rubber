import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS, CACHE_TTL, invalidateProductTypesCache } from '@/lib/cache';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

function parseIncludeInactive(searchParams: URLSearchParams): boolean {
  const v = String(searchParams.get('includeInactive') ?? '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

// GET /api/product-types — active only by default; ?includeInactive=1 for admin lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = parseIncludeInactive(searchParams);
    const cacheKey = includeInactive ? CACHE_KEYS.PRODUCT_TYPES_ALL : CACHE_KEYS.PRODUCT_TYPES_ACTIVE;

    logger.info('GET /api/product-types', { includeInactive });

    const cachedProductTypes = cache.get(cacheKey);
    if (cachedProductTypes) {
      logger.info('GET /api/product-types - Cache hit', { includeInactive });
      return NextResponse.json(cachedProductTypes);
    }

    logger.info('GET /api/product-types - Cache miss, fetching from database', { includeInactive });
    const productTypes = await prisma.productType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { code: 'asc' },
    });

    cache.set(cacheKey, productTypes, CACHE_TTL.PRODUCT_TYPES);

    logger.info('GET /api/product-types - Success', { count: productTypes.length, includeInactive });
    return NextResponse.json(productTypes);
  } catch (error) {
    logger.error('GET /api/product-types - Failed', error);
    return NextResponse.json(
      { error: 'Failed to load product types' },
      { status: 500 }
    );
  }
}

// POST /api/product-types - Create new product type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description } = body;

    logger.info('POST /api/product-types', { code, name });

    if (!code || !name) {
      logger.warn('POST /api/product-types - Missing required fields');
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.productType.findUnique({
      where: { code },
    });

    if (existing) {
      logger.warn('POST /api/product-types - Duplicate code', { code });
      return NextResponse.json(
        { error: 'Product type code already exists' },
        { status: 409 }
      );
    }

    const productType = await prisma.productType.create({
      data: {
        code,
        name,
        description: description || null,
      },
    });

    invalidateProductTypesCache();
    logger.info('POST /api/product-types - Cache invalidated');

    logger.info('POST /api/product-types - Success', { id: productType.id, code });
    return NextResponse.json(productType, { status: 201 });
  } catch (error) {
    logger.error('POST /api/product-types - Failed', error);
    return NextResponse.json(
      { error: 'Failed to create product type' },
      { status: 500 }
    );
  }
}

