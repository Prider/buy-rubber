import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stockLedgerEntry, stockPosition } from '@/lib/prismaStock';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 200;

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
type SaleAggResult = { soldKg: number; revenue: number };

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

    // Single aggregate query instead of loading every Sale row into memory
    const saleAggPromise = prisma.$queryRaw<SaleAggResult[]>`
      SELECT
        CAST(COALESCE(SUM(weight), 0) AS REAL) AS "soldKg",
        CAST(COALESCE(SUM(weight * "pricePerUnit"), 0) AS REAL) AS revenue
      FROM "Sale"
      WHERE "productTypeId" = ${productTypeId}
    `;

    const [productType, position, saleAgg, entries, total] = await Promise.all([
      prisma.productType.findUnique({
        where: { id: productTypeId },
        select: { id: true, code: true, name: true },
      }),
      stockPosition.findUnique({
        where: { productTypeId },
        select: { quantityKg: true, avgCostPerKg: true },
      }),
      saleAggPromise,
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
      SaleAggResult[],
      StockLedgerRow[],
      number,
    ];

    const soldKg = Number(saleAgg[0]?.soldKg ?? 0);
    const revenue = Number(saleAgg[0]?.revenue ?? 0);
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
