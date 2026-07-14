import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchProfitLossAggregates } from './aggregates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ViewMode = 'daily' | 'weekly' | 'monthly';

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

function emptyAccumulator(period: string): PeriodAccumulator {
  return {
    period,
    sales: 0,
    purchases: 0,
    expenses: 0,
    purchasePriceWeighted: 0,
    purchaseWeight: 0,
    salePriceWeighted: 0,
    saleWeight: 0,
  };
}

function parseViewMode(raw: string | null): ViewMode {
  if (raw === 'daily' || raw === 'weekly') return raw;
  return 'monthly';
}

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

/** Monday as week start, matching Postgres DATE_TRUNC('week'). */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}

function keyFromDate(date: Date, mode: ViewMode): string {
  const target = mode === 'weekly' ? startOfWeek(date) : date;
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  if (mode === 'monthly') {
    return `${year}-${month}`;
  }
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function periodKeyFromAggregate(period: Date | string | null | undefined, mode: ViewMode): string {
  if (period == null) return '';
  if (typeof period === 'string') {
    if (mode === 'monthly') return period.slice(0, 7);
    // daily / weekly keys are YYYY-MM-DD (week = Monday)
    return period.slice(0, 10);
  }
  if (period instanceof Date && !Number.isNaN(period.getTime())) {
    return keyFromDate(period, mode);
  }
  return '';
}

function createPeriodMap(startDate: Date, endDate: Date, mode: ViewMode): Map<string, PeriodAccumulator> {
  const map = new Map<string, PeriodAccumulator>();
  const cursor = new Date(startDate);

  if (mode === 'monthly') {
    cursor.setDate(1);
    while (cursor <= endDate) {
      const key = keyFromDate(cursor, mode);
      map.set(key, emptyAccumulator(key));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return map;
  }

  if (mode === 'weekly') {
    const weekCursor = startOfWeek(cursor);
    while (weekCursor <= endDate) {
      const key = keyFromDate(weekCursor, mode);
      map.set(key, emptyAccumulator(key));
      weekCursor.setDate(weekCursor.getDate() + 7);
    }
    return map;
  }

  while (cursor <= endDate) {
    const key = keyFromDate(cursor, mode);
    map.set(key, emptyAccumulator(key));
    cursor.setDate(cursor.getDate() + 1);
  }

  return map;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewMode = parseViewMode(searchParams.get('view'));

    const parsedStart = parseDateOrNull(searchParams.get('startDate'));
    const parsedEnd = parseDateOrNull(searchParams.get('endDate'));

    const today = new Date();
    const fallbackStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = startOfDay(parsedStart ?? fallbackStart);
    const endDate = endOfDay(parsedEnd ?? today);

    if (startDate > endDate) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const [saleAggs, purchaseAggs, expenseAggs] = await fetchProfitLossAggregates(
      startDate,
      endDate,
      viewMode,
    );

    const periodMap = createPeriodMap(startDate, endDate, viewMode);

    for (const row of saleAggs) {
      const key = periodKeyFromAggregate(row.period, viewMode);
      if (!key) continue;
      const acc = periodMap.get(key);
      if (!acc) continue;
      acc.sales += Number(row.total);
      acc.salePriceWeighted += Number(row.weighted_price);
      acc.saleWeight += Number(row.weight);
    }

    for (const row of purchaseAggs) {
      const key = periodKeyFromAggregate(row.period, viewMode);
      if (!key) continue;
      const acc = periodMap.get(key);
      if (!acc) continue;
      acc.purchases += Number(row.total);
      acc.purchasePriceWeighted += Number(row.weighted_price);
      acc.purchaseWeight += Number(row.weight);
    }

    for (const row of expenseAggs) {
      const key = periodKeyFromAggregate(row.period, viewMode);
      if (!key) continue;
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
