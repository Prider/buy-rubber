import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stockGang } from '@/lib/prismaStock';
import { parseSaleNosJson } from '@/lib/stock/stockGangs';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 200;

type StockGangRecord = {
  gangNo: number;
  startDate: Date;
  endDate: Date | null;
  soldKg: number;
  cogs: number;
  saleNosJson: string;
  salesCount: number;
};

type SaleRow = { saleNo: string; totalAmount: number };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productTypeId = searchParams.get('productTypeId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (!productTypeId) {
      return NextResponse.json({ error: 'Missing productTypeId' }, { status: 400 });
    }

    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    );

    const [pageGangs, total] = (await Promise.all([
      stockGang.findMany({
        where: { productTypeId },
        orderBy: { gangNo: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          gangNo: true,
          startDate: true,
          endDate: true,
          soldKg: true,
          cogs: true,
          saleNosJson: true,
          salesCount: true,
        },
      }),
      stockGang.count({ where: { productTypeId } }),
    ])) as [StockGangRecord[], number];

    if (total === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      });
    }

    const allSaleNos = new Set<string>();
    const saleNosByGang = pageGangs.map((g) => {
      const saleNos = parseSaleNosJson(g.saleNosJson);
      for (const sn of saleNos) allSaleNos.add(sn);
      return saleNos;
    });

    const saleNoArr = [...allSaleNos];
    const saleMap = new Map<string, number>();
    if (saleNoArr.length > 0) {
      const sales = (await prisma.sale.findMany({
        where: { saleNo: { in: saleNoArr } },
        select: { saleNo: true, totalAmount: true },
      })) as SaleRow[];

      for (const s of sales) {
        saleMap.set(s.saleNo, Number(s.totalAmount));
      }
    }

    const data = pageGangs.map((g, i) => {
      const saleNos = saleNosByGang[i] ?? [];
      let revenue = 0;
      for (const sn of saleNos) {
        revenue += saleMap.get(sn) ?? 0;
      }

      return {
        gangNo: g.gangNo,
        startDate: g.startDate,
        endDate: g.endDate,
        soldKg: g.soldKg,
        revenue,
        cogs: g.cogs,
        profitLoss: revenue - g.cogs,
        salesCount: g.salesCount || saleNos.length,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงกำไร/ขาดทุนต่อกอง' }, { status: 500 });
  }
}
