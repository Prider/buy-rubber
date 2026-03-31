import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stockLedgerEntry, stockPosition } from '@/lib/prismaStock';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productTypeId = searchParams.get('productTypeId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      ),
    );

    if (!productTypeId) {
      return NextResponse.json({ error: 'Missing productTypeId' }, { status: 400 });
    }

    const [productType, position, entries, total] = await Promise.all([
      prisma.productType.findUnique({
        where: { id: productTypeId },
        select: { id: true, code: true, name: true },
      }),
      stockPosition.findUnique({
        where: { productTypeId },
        select: { quantityKg: true, avgCostPerKg: true },
      }),
      stockLedgerEntry.findMany({
        where: { productTypeId },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          refType: true,
          refNo: true,
          qtyChangeKg: true,
          unitCostPerKg: true,
          totalCost: true,
          balanceQtyKg: true,
          balanceAvgCostPerKg: true,
          date: true,
          notes: true,
        },
      }),
      stockLedgerEntry.count({ where: { productTypeId } }),
    ]);

    return NextResponse.json({
      productType: productType ?? { id: productTypeId, code: '-', name: '-' },
      position: {
        quantityKg: position?.quantityKg ?? 0,
        avgCostPerKg: position?.avgCostPerKg ?? 0,
      },
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (_e) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึง ledger' }, { status: 500 });
  }
}
