import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stockLedgerEntry, stockPosition } from '@/lib/prismaStock';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 200;

type SaleRow = { weight: number; pricePerUnit: number };
type SaleFindManyDelegate = { findMany(args?: unknown): Promise<SaleRow[]> };
const asSale = prisma as unknown as { sale?: SaleFindManyDelegate };
type StockPositionRow = { quantityKg: number; avgCostPerKg: number };
type StockLedgerRow = {
  id: string;
  refType: string;
  refNo: string | null;
  qtyChangeKg: number;
  unitCostPerKg: number | null;
  totalCost: number | null;
  balanceQtyKg: number;
  balanceAvgCostPerKg: number;
  date: Date;
  notes: string | null;
};

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

    const saleRowsPromise = asSale.sale
      ? asSale.sale.findMany({
          where: { productTypeId },
          select: { weight: true, pricePerUnit: true },
        })
      : Promise.resolve([]);

    const [productType, position, saleRows, entries, total] = await Promise.all([
      prisma.productType.findUnique({
        where: { id: productTypeId },
        select: { id: true, code: true, name: true },
      }),
      stockPosition.findUnique({
        where: { productTypeId },
        select: { quantityKg: true, avgCostPerKg: true },
      }),
      saleRowsPromise,
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
    ]) as [
      { id: string; code: string; name: string } | null,
      StockPositionRow | null,
      SaleRow[],
      StockLedgerRow[],
      number,
    ];

    let soldKg = 0;
    let revenue = 0;
    for (const r of saleRows) {
      const w = Number(r.weight ?? 0);
      const p = Number(r.pricePerUnit ?? 0);
      soldKg += w;
      revenue += w * p;
    }
    const avgSellingPricePerKg = soldKg > 0 ? revenue / soldKg : null;
    const positionData = (position ?? null) as StockPositionRow | null;

    return NextResponse.json({
      productType: productType ?? { id: productTypeId, code: '-', name: '-' },
      position: {
        quantityKg: positionData?.quantityKg ?? 0,
        avgCostPerKg: positionData?.avgCostPerKg ?? 0,
        avgSellingPricePerKg,
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
