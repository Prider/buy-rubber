import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stockPosition } from '@/lib/prismaStock';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const MAX_PAGE_SIZE = 200;

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
    const positions =
      ids.length === 0
        ? []
        : limit !== undefined
          ? await stockPosition.findMany({
              where: { productTypeId: { in: ids } },
              select: { productTypeId: true, quantityKg: true, avgCostPerKg: true },
            })
          : await stockPosition.findMany({
              select: { productTypeId: true, quantityKg: true, avgCostPerKg: true },
            });

    const posMap = new Map<string, { quantityKg: number; avgCostPerKg: number }>(
      positions.map((p) => [p.productTypeId, { quantityKg: p.quantityKg, avgCostPerKg: p.avgCostPerKg }]),
    );

    const result = productTypes.map((pt) => {
      const pos = posMap.get(pt.id);
      return {
        productTypeId: pt.id,
        productType: { id: pt.id, code: pt.code, name: pt.name },
        quantityKg: pos?.quantityKg ?? 0,
        avgCostPerKg: pos?.avgCostPerKg ?? 0,
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
