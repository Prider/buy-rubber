import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/product-types - Get all product types
export async function GET(_request: NextRequest) {
  try {
    logger.info('GET /api/product-types');
    
    // Check cache first
    const cachedProductTypes = cache.get(CACHE_KEYS.PRODUCT_TYPES);
    if (cachedProductTypes) {
      logger.info('GET /api/product-types - Cache hit');
      return NextResponse.json(cachedProductTypes);
    }
    
    logger.info('GET /api/product-types - Cache miss, fetching from database');
    const productTypes = await prisma.productType.findMany({
      orderBy: { code: 'asc' },
    });

    // Cache the response for 30 minutes (product types don't change often)
    cache.set(CACHE_KEYS.PRODUCT_TYPES, productTypes, CACHE_TTL.PRODUCT_TYPES);

    logger.info('GET /api/product-types - Success', { count: productTypes.length });
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

    // Invalidate product types cache when a new product type is created
    cache.delete(CACHE_KEYS.PRODUCT_TYPES);
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

