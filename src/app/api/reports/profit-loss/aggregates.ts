import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPostgresDatabase } from '@/lib/dbProvider';

export type ViewMode = 'daily' | 'monthly';

export type PurchaseSaleAgg = {
  period: Date | string;
  total: number;
  weighted_price: number;
  weight: number;
};

export type ExpenseAgg = {
  period: Date | string;
  total: number;
};

function sqlitePeriodExpr(viewMode: ViewMode) {
  return viewMode === 'daily'
    ? Prisma.sql`strftime('%Y-%m-%d', "date" / 1000, 'unixepoch')`
    : Prisma.sql`strftime('%Y-%m', "date" / 1000, 'unixepoch')`;
}

async function fetchPostgresSaleAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<PurchaseSaleAgg[]> {
  const truncUnit = viewMode === 'daily' ? 'day' : 'month';
  return prisma.$queryRaw<PurchaseSaleAgg[]>`
    SELECT DATE_TRUNC(${truncUnit}, date) AS period,
           COALESCE(SUM("totalAmount"), 0)::float AS total,
           COALESCE(SUM("pricePerUnit" * weight), 0)::float AS weighted_price,
           COALESCE(SUM(weight), 0)::float AS weight
    FROM "Sale"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchSqliteSaleAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<PurchaseSaleAgg[]> {
  const periodExpr = sqlitePeriodExpr(viewMode);
  return prisma.$queryRaw<PurchaseSaleAgg[]>`
    SELECT ${periodExpr} AS period,
           CAST(COALESCE(SUM("totalAmount"), 0) AS REAL) AS total,
           CAST(COALESCE(SUM("pricePerUnit" * weight), 0) AS REAL) AS weighted_price,
           CAST(COALESCE(SUM(weight), 0) AS REAL) AS weight
    FROM "Sale"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchPostgresPurchaseAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<PurchaseSaleAgg[]> {
  const truncUnit = viewMode === 'daily' ? 'day' : 'month';
  return prisma.$queryRaw<PurchaseSaleAgg[]>`
    SELECT DATE_TRUNC(${truncUnit}, date) AS period,
           COALESCE(SUM("totalAmount"), 0)::float AS total,
           COALESCE(SUM("finalPrice" * "netWeight"), 0)::float AS weighted_price,
           COALESCE(SUM("netWeight"), 0)::float AS weight
    FROM "Purchase"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchSqlitePurchaseAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<PurchaseSaleAgg[]> {
  const periodExpr = sqlitePeriodExpr(viewMode);
  return prisma.$queryRaw<PurchaseSaleAgg[]>`
    SELECT ${periodExpr} AS period,
           CAST(COALESCE(SUM("totalAmount"), 0) AS REAL) AS total,
           CAST(COALESCE(SUM("finalPrice" * "netWeight"), 0) AS REAL) AS weighted_price,
           CAST(COALESCE(SUM("netWeight"), 0) AS REAL) AS weight
    FROM "Purchase"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchPostgresExpenseAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<ExpenseAgg[]> {
  const truncUnit = viewMode === 'daily' ? 'day' : 'month';
  return prisma.$queryRaw<ExpenseAgg[]>`
    SELECT DATE_TRUNC(${truncUnit}, date) AS period,
           COALESCE(SUM(amount), 0)::float AS total
    FROM "Expense"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchSqliteExpenseAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<ExpenseAgg[]> {
  const periodExpr = sqlitePeriodExpr(viewMode);
  return prisma.$queryRaw<ExpenseAgg[]>`
    SELECT ${periodExpr} AS period,
           CAST(COALESCE(SUM(amount), 0) AS REAL) AS total
    FROM "Expense"
    WHERE "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

export async function fetchProfitLossAggregates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<[PurchaseSaleAgg[], PurchaseSaleAgg[], ExpenseAgg[]]> {
  if (isPostgresDatabase()) {
    return Promise.all([
      fetchPostgresSaleAggregates(startDate, endDate, viewMode),
      fetchPostgresPurchaseAggregates(startDate, endDate, viewMode),
      fetchPostgresExpenseAggregates(startDate, endDate, viewMode),
    ]);
  }

  return Promise.all([
    fetchSqliteSaleAggregates(startDate, endDate, viewMode),
    fetchSqlitePurchaseAggregates(startDate, endDate, viewMode),
    fetchSqliteExpenseAggregates(startDate, endDate, viewMode),
  ]);
}
