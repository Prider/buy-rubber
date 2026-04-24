import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

type ViewMode = 'daily' | 'monthly';

interface PeriodAccumulator {
  period: string;
  sales: number;
  purchases: number;
  expenses: number;
  purchasePriceWeighted: number;
  purchaseWeight: number;
  salePriceWeighted: number;
  saleWeight: number;
}

type SaleFindManyDelegate = {
  findMany(args?: unknown): Promise<
    Array<{
      date: Date;
      totalAmount: number;
      pricePerUnit: number;
      weight: number;
    }>
  >;
};

const asSale = prisma as unknown as { sale?: SaleFindManyDelegate };

function parseDateOrNull(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function keyFromDate(date: Date, mode: ViewMode): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  if (mode === 'monthly') {
    return `${year}-${month}`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createPeriodMap(startDate: Date, endDate: Date, mode: ViewMode): Map<string, PeriodAccumulator> {
  const map = new Map<string, PeriodAccumulator>();
  const cursor = new Date(startDate);

  if (mode === 'monthly') {
    cursor.setDate(1);
    while (cursor <= endDate) {
      const key = keyFromDate(cursor, mode);
      map.set(key, {
        period: key,
        sales: 0,
        purchases: 0,
        expenses: 0,
        purchasePriceWeighted: 0,
        purchaseWeight: 0,
        salePriceWeighted: 0,
        saleWeight: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return map;
  }

  while (cursor <= endDate) {
    const key = keyFromDate(cursor, mode);
    map.set(key, {
      period: key,
      sales: 0,
      purchases: 0,
      expenses: 0,
      purchasePriceWeighted: 0,
      purchaseWeight: 0,
      salePriceWeighted: 0,
      saleWeight: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return map;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewParam = searchParams.get('view');
    const viewMode: ViewMode = viewParam === 'daily' ? 'daily' : 'monthly';

    const parsedStart = parseDateOrNull(searchParams.get('startDate'));
    const parsedEnd = parseDateOrNull(searchParams.get('endDate'));

    const today = new Date();
    const fallbackStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = startOfDay(parsedStart ?? fallbackStart);
    const endDate = endOfDay(parsedEnd ?? today);

    if (startDate > endDate) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const salesPromise = asSale.sale
      ? asSale.sale.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          select: { date: true, totalAmount: true, pricePerUnit: true, weight: true },
        })
      : Promise.resolve([]);

    const [sales, purchases, expenses] = await Promise.all([
      salesPromise,
      prisma.purchase.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        select: { date: true, totalAmount: true, finalPrice: true, netWeight: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        select: { date: true, amount: true },
      }),
    ]);

    const periodMap = createPeriodMap(startDate, endDate, viewMode);

    for (const item of sales) {
      const key = keyFromDate(item.date, viewMode);
      const row = periodMap.get(key);
      if (!row) continue;
      row.sales += item.totalAmount || 0;
      row.salePriceWeighted += (item.pricePerUnit || 0) * (item.weight || 0);
      row.saleWeight += item.weight || 0;
    }

    for (const item of purchases) {
      const key = keyFromDate(item.date, viewMode);
      const row = periodMap.get(key);
      if (!row) continue;
      row.purchases += item.totalAmount || 0;
      row.purchasePriceWeighted += (item.finalPrice || 0) * (item.netWeight || 0);
      row.purchaseWeight += item.netWeight || 0;
    }

    for (const item of expenses) {
      const key = keyFromDate(item.date, viewMode);
      const row = periodMap.get(key);
      if (!row) continue;
      row.expenses += item.amount || 0;
    }

    const periods = Array.from(periodMap.values()).map((row) => {
      const purchasePricePerKg = row.purchaseWeight > 0 ? row.purchasePriceWeighted / row.purchaseWeight : 0;
      const salePricePerKg = row.saleWeight > 0 ? row.salePriceWeighted / row.saleWeight : 0;
      const net = row.sales - row.purchases - row.expenses;

      return {
        period: row.period,
        sales: row.sales,
        purchases: row.purchases,
        expenses: row.expenses,
        purchasePricePerKg,
        salePricePerKg,
        net,
      };
    });

    const totals = periods.reduce(
      (acc, row) => {
        acc.sales += row.sales;
        acc.purchases += row.purchases;
        acc.expenses += row.expenses;
        acc.net += row.net;
        return acc;
      },
      { sales: 0, purchases: 0, expenses: 0, net: 0 }
    );

    return NextResponse.json({
      view: viewMode,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      periods,
      totals,
    });
  } catch (error) {
    logger.error('GET /api/reports/profit-loss failed', error);
    return NextResponse.json({ error: 'Failed to load profit-loss report' }, { status: 500 });
  }
}
