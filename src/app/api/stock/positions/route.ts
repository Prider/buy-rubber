import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stockPosition } from '@/lib/prismaStock';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const MAX_PAGE_SIZE = 200;

type SaleAggRow = {
  productTypeId: string;
  weight: number;
  pricePerUnit: number;
};
type StockPositionRow = {
  productTypeId: string;
  quantityKg: number;
  avgCostPerKg: number;
};
type SaleFindManyDelegate = {
  findMany(args?: unknown): Promise<SaleAggRow[]>;
};
const asSale = prisma as unknown as { sale?: SaleFindManyDelegate };

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
    const limit = paginated
      ? Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitParam || '30', 10) || 30))
      : undefined;

    const [productTypes, total] = await Promise.all([
      prisma.productType.findMany({
        where,
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
        ...(limit !== undefined ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      paginated ? prisma.productType.count({ where }) : Promise.resolve(0),
    ]);

    const ids = productTypes.map((pt) => pt.id);
    const positions = (
      ids.length === 0
        ? []
        : limit !== undefined
          ? await stockPosition.findMany({
              where: { productTypeId: { in: ids } },
              select: { productTypeId: true, quantityKg: true, avgCostPerKg: true },
            })
          : await stockPosition.findMany({
              select: { productTypeId: true, quantityKg: true, avgCostPerKg: true },
            })
    ) as StockPositionRow[];

    const posMap = new Map<string, { quantityKg: number; avgCostPerKg: number }>(
      positions.map((p: StockPositionRow) => [
        p.productTypeId,
        { quantityKg: p.quantityKg, avgCostPerKg: p.avgCostPerKg },
      ]),
    );

    // "ราคาขายเฉลี่ย" = (sum(weight * pricePerUnit) / sum(weight)) for each productTypeId
    const saleAggMap = new Map<string, { soldKg: number; revenue: number }>();
    if (ids.length > 0) {
      const salesRows = asSale.sale
        ? await asSale.sale.findMany({
            where: { productTypeId: { in: ids } },
            select: { productTypeId: true, weight: true, pricePerUnit: true },
          })
        : [];

      for (const row of salesRows) {
        const soldKg = Number(row.weight ?? 0);
        const pricePerKg = Number(row.pricePerUnit ?? 0);
        const cur = saleAggMap.get(row.productTypeId) ?? { soldKg: 0, revenue: 0 };
        cur.soldKg += soldKg;
        cur.revenue += soldKg * pricePerKg;
        saleAggMap.set(row.productTypeId, cur);
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

    if (paginated && limit !== undefined) {
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
