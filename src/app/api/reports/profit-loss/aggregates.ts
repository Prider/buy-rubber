import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPostgresDatabase } from '@/lib/dbProvider';

export type ViewMode = 'daily' | 'weekly' | 'monthly';

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

function postgresTruncUnit(viewMode: ViewMode): 'day' | 'week' | 'month' {
  if (viewMode === 'daily') return 'day';
  if (viewMode === 'weekly') return 'week';
  return 'month';
}

function sqlitePeriodExpr(viewMode: ViewMode) {
  if (viewMode === 'daily') {
    return Prisma.sql`strftime('%Y-%m-%d', "date" / 1000, 'unixepoch')`;
  }
  if (viewMode === 'weekly') {
    // Monday-start week to match Postgres DATE_TRUNC('week')
    return Prisma.sql`strftime(
      '%Y-%m-%d',
      "date" / 1000,
      'unixepoch',
      '-' || ((CAST(strftime('%w', "date" / 1000, 'unixepoch') AS INTEGER) + 6) % 7) || ' days'
    )`;
  }
  return Prisma.sql`strftime('%Y-%m', "date" / 1000, 'unixepoch')`;
}

async function fetchPostgresSaleAggregates(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<PurchaseSaleAgg[]> {
  const truncUnit = postgresTruncUnit(viewMode);
  return prisma.$queryRaw<PurchaseSaleAgg[]>`
    SELECT DATE_TRUNC(${truncUnit}, date) AS period,
           COALESCE(SUM("totalAmount"), 0)::float AS total,
           COALESCE(SUM("pricePerUnit" * weight), 0)::float AS weighted_price,
           COALESCE(SUM(weight), 0)::float AS weight
    FROM "Sale"
    WHERE "tenantId" = ${tenantId} AND "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchSqliteSaleAggregates(
  tenantId: string,
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
    WHERE "tenantId" = ${tenantId} AND "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchPostgresPurchaseAggregates(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<PurchaseSaleAgg[]> {
  const truncUnit = postgresTruncUnit(viewMode);
  return prisma.$queryRaw<PurchaseSaleAgg[]>`
    SELECT DATE_TRUNC(${truncUnit}, date) AS period,
           COALESCE(SUM("totalAmount"), 0)::float AS total,
           COALESCE(SUM("finalPrice" * "netWeight"), 0)::float AS weighted_price,
           COALESCE(SUM("netWeight"), 0)::float AS weight
    FROM "Purchase"
    WHERE "tenantId" = ${tenantId} AND "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchSqlitePurchaseAggregates(
  tenantId: string,
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
    WHERE "tenantId" = ${tenantId} AND "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchPostgresExpenseAggregates(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<ExpenseAgg[]> {
  const truncUnit = postgresTruncUnit(viewMode);
  return prisma.$queryRaw<ExpenseAgg[]>`
    SELECT DATE_TRUNC(${truncUnit}, date) AS period,
           COALESCE(SUM(amount), 0)::float AS total
    FROM "Expense"
    WHERE "tenantId" = ${tenantId} AND "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

async function fetchSqliteExpenseAggregates(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<ExpenseAgg[]> {
  const periodExpr = sqlitePeriodExpr(viewMode);
  return prisma.$queryRaw<ExpenseAgg[]>`
    SELECT ${periodExpr} AS period,
           CAST(COALESCE(SUM(amount), 0) AS REAL) AS total
    FROM "Expense"
    WHERE "tenantId" = ${tenantId} AND "date" >= ${startDate} AND "date" <= ${endDate}
    GROUP BY 1
  `;
}

export async function fetchProfitLossAggregates(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Promise<[PurchaseSaleAgg[], PurchaseSaleAgg[], ExpenseAgg[]]> {
  if (isPostgresDatabase()) {
    return Promise.all([
      fetchPostgresSaleAggregates(tenantId, startDate, endDate, viewMode),
      fetchPostgresPurchaseAggregates(tenantId, startDate, endDate, viewMode),
      fetchPostgresExpenseAggregates(tenantId, startDate, endDate, viewMode),
    ]);
  }

  return Promise.all([
    fetchSqliteSaleAggregates(tenantId, startDate, endDate, viewMode),
    fetchSqlitePurchaseAggregates(tenantId, startDate, endDate, viewMode),
    fetchSqliteExpenseAggregates(tenantId, startDate, endDate, viewMode),
  ]);
}
