import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/product-types - Get all product types
export async function GET(request: NextRequest) {
  try {
    const productTypes = await prisma.productType.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(productTypes);
  } catch (error) {
    console.error('Get product types error:', error);
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

    if (!code || !name) {
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

    return NextResponse.json(productType, { status: 201 });
  } catch (error) {
    console.error('Create product type error:', error);
    return NextResponse.json(
      { error: 'Failed to create product type' },
      { status: 500 }
    );
  }
}

