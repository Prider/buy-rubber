import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/product-types - Get all product types
export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/product-types');
    
    const productTypes = await prisma.productType.findMany({
      orderBy: { code: 'asc' },
    });

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

