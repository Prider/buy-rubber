import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

type PurchaseSaleAgg = { period: Date; total: number; weighted_price: number; weight: number };
type ExpenseAgg = { period: Date; total: number };

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

    // Push all aggregation to the DB with DATE_TRUNC — returns one row per period,
    // never loading individual Sale/Purchase/Expense rows into Node.js memory.
    const truncUnit = viewMode === 'daily' ? 'day' : 'month';

    const [saleAggs, purchaseAggs, expenseAggs] = await Promise.all([
      prisma.$queryRaw<PurchaseSaleAgg[]>`
        SELECT DATE_TRUNC(${truncUnit}, date) AS period,
               COALESCE(SUM("totalAmount"), 0)::float  AS total,
               COALESCE(SUM("pricePerUnit" * weight), 0)::float AS weighted_price,
               COALESCE(SUM(weight), 0)::float          AS weight
        FROM "Sale"
        WHERE date >= ${startDate} AND date <= ${endDate}
        GROUP BY DATE_TRUNC(${truncUnit}, date)
      `,
      prisma.$queryRaw<PurchaseSaleAgg[]>`
        SELECT DATE_TRUNC(${truncUnit}, date) AS period,
               COALESCE(SUM("totalAmount"), 0)::float          AS total,
               COALESCE(SUM("finalPrice" * "netWeight"), 0)::float AS weighted_price,
               COALESCE(SUM("netWeight"), 0)::float             AS weight
        FROM "Purchase"
        WHERE date >= ${startDate} AND date <= ${endDate}
        GROUP BY DATE_TRUNC(${truncUnit}, date)
      `,
      prisma.$queryRaw<ExpenseAgg[]>`
        SELECT DATE_TRUNC(${truncUnit}, date) AS period,
               COALESCE(SUM(amount), 0)::float AS total
        FROM "Expense"
        WHERE date >= ${startDate} AND date <= ${endDate}
        GROUP BY DATE_TRUNC(${truncUnit}, date)
      `,
    ]);

    const periodMap = createPeriodMap(startDate, endDate, viewMode);

    for (const row of saleAggs) {
      const key = keyFromDate(new Date(row.period), viewMode);
      const acc = periodMap.get(key);
      if (!acc) continue;
      acc.sales += Number(row.total);
      acc.salePriceWeighted += Number(row.weighted_price);
      acc.saleWeight += Number(row.weight);
    }

    for (const row of purchaseAggs) {
      const key = keyFromDate(new Date(row.period), viewMode);
      const acc = periodMap.get(key);
      if (!acc) continue;
      acc.purchases += Number(row.total);
      acc.purchasePriceWeighted += Number(row.weighted_price);
      acc.purchaseWeight += Number(row.weight);
    }

    for (const row of expenseAggs) {
      const key = keyFromDate(new Date(row.period), viewMode);
      const acc = periodMap.get(key);
      if (!acc) continue;
      acc.expenses += Number(row.total);
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
      { sales: 0, purchases: 0, expenses: 0, net: 0 },
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
