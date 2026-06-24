import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stockPosition } from '@/lib/prismaStock';

export const runtime = 'nodejs';

const MAX_PAGE_SIZE = 200;

type StockPositionRow = {
  productTypeId: string;
  quantityKg: number;
  avgCostPerKg: number;
};
type SaleAgg = { productTypeId: string; soldKg: number; revenue: number };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const where: Prisma.ProductTypeWhereInput = { isActive: true };
    if (search) {
      where.OR = [{ code: { contains: search } }, { name: { contains: search } }];
    }

    const paginated = pageParam != null && pageParam !== '';
    const page = paginated ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    // Always cap rows — unpaginated path uses MAX_PAGE_SIZE as a hard ceiling
    const limit = paginated
      ? Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitParam || '30', 10) || 30))
      : MAX_PAGE_SIZE;

    const [productTypes, total] = await Promise.all([
      prisma.productType.findMany({
        where,
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
        skip: paginated ? (page - 1) * limit : 0,
        take: limit,
      }),
      paginated ? prisma.productType.count({ where }) : Promise.resolve(0),
    ]);

    const ids = productTypes.map((pt) => pt.id);
    const positions = (
      ids.length === 0
        ? []
        : await stockPosition.findMany({
            where: { productTypeId: { in: ids } },
            select: { productTypeId: true, quantityKg: true, avgCostPerKg: true },
          })
    ) as StockPositionRow[];

    const posMap = new Map<string, { quantityKg: number; avgCostPerKg: number }>(
      positions.map((p: StockPositionRow) => [
        p.productTypeId,
        { quantityKg: p.quantityKg, avgCostPerKg: p.avgCostPerKg },
      ]),
    );

    // ราคาขายเฉลี่ย = SUM(weight * pricePerUnit - expenseCost) / SUM(weight) per productTypeId
    // Aggregated in SQL to avoid loading every Sale row into memory
    const saleAggMap = new Map<string, { soldKg: number; revenue: number }>();
    if (ids.length > 0) {
      const saleAggs = await prisma.$queryRaw<SaleAgg[]>`
        SELECT "productTypeId",
               CAST(COALESCE(SUM(weight), 0) AS REAL) AS "soldKg",
               CAST(COALESCE(SUM(weight * "pricePerUnit" - COALESCE("expenseCost", 0)), 0) AS REAL) AS revenue
        FROM "Sale"
        WHERE "productTypeId" IN (${Prisma.join(ids)})
        GROUP BY "productTypeId"
      `;
      for (const row of saleAggs) {
        saleAggMap.set(row.productTypeId, {
          soldKg: Number(row.soldKg),
          revenue: Number(row.revenue),
        });
      }
    }

    const result = productTypes.map((pt) => {
      const pos = posMap.get(pt.id);
      const saleAgg = saleAggMap.get(pt.id);
      const soldKg = saleAgg?.soldKg ?? 0;
      const avgSellingPricePerKg = soldKg > 0 ? saleAgg!.revenue / soldKg : null;

      return {
        productTypeId: pt.id,
        productType: { id: pt.id, code: pt.code, name: pt.name },
        quantityKg: pos?.quantityKg ?? 0,
        avgCostPerKg: pos?.avgCostPerKg ?? 0,
        avgSellingPricePerKg,
        soldKg,
      };
    });

    if (paginated) {
      return NextResponse.json({
        data: result,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    return NextResponse.json(result);
  } catch (_e) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงยอดสต็อก' }, { status: 500 });
  }
}
