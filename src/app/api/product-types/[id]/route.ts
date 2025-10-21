import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/product-types/[id] - Update product type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const productType = await prisma.productType.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(productType);
  } catch (error) {
    console.error('Update product type error:', error);
    return NextResponse.json(
      { error: 'Failed to update product type' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-types/[id] - Delete product type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.productType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product type error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product type' },
      { status: 500 }
    );
  }
}

