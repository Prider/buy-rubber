import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stockLedgerEntry, stockPosition } from '@/lib/prismaStock';
import { invalidateProductTypesCache } from '@/lib/cache';

type SaleCountDelegate = {
  count(args?: unknown): Promise<number>;
};

const asSale = prisma as unknown as {
  sale?: SaleCountDelegate;
};

function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
}

// PUT /api/product-types/[id] - Update product type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const data: {
      name: string;
      description: string | null;
      isActive?: boolean;
    } = {
      name,
      description: description || null,
    };
    if (typeof isActive === 'boolean') {
      data.isActive = isActive;
    }

    const productType = await prisma.productType.update({
      where: { id: params.id },
      data,
    });

    invalidateProductTypesCache();

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
    const existing = await prisma.productType.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 });
    }

    const saleCountPromise = asSale.sale
      ? asSale.sale.count({ where: { productTypeId: params.id } })
      : Promise.resolve(0);

    const [purchaseCount, saleCount, ledgerCount, positionRow] = await Promise.all([
      prisma.purchase.count({ where: { productTypeId: params.id } }),
      saleCountPromise,
      stockLedgerEntry.count({ where: { productTypeId: params.id } }),
      stockPosition.findUnique({
        where: { productTypeId: params.id },
        select: { id: true },
      }),
    ]);
    const positionCount = positionRow ? 1 : 0;

    const blocked =
      purchaseCount > 0 || saleCount > 0 || ledgerCount > 0 || positionCount > 0;
    if (blocked) {
      const productType = await prisma.productType.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      invalidateProductTypesCache();
      return NextResponse.json({
        success: true,
        deactivated: true,
        productType,
      });
    }

    await prisma.productType.delete({
      where: { id: params.id },
    });

    invalidateProductTypesCache();

    return NextResponse.json({ success: true, deactivated: false });
  } catch (error) {
    console.error('Delete product type error:', error);
    if (isForeignKeyViolation(error)) {
      return NextResponse.json(
        {
          error:
            'Cannot delete this product type because other records still reference it.',
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete product type' },
      { status: 500 }
    );
  }
}

