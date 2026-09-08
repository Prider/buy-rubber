import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORT_TYPES = ['daily_purchase', 'member_summary', 'expense_summary'] as const;
type ReportSummaryType = (typeof REPORT_TYPES)[number];

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;
const EXPORT_MAX = 10_000;

const purchaseRowSelect = {
  id: true,
  date: true,
  purchaseNo: true,
  dryWeight: true,
  totalAmount: true,
  member: { select: { id: true, name: true } },
  productType: { select: { id: true, name: true } },
} satisfies Prisma.PurchaseSelect;

const expenseRowSelect = {
  id: true,
  expenseNo: true,
  date: true,
  category: true,
  amount: true,
  description: true,
  createdAt: true,
} satisfies Prisma.ExpenseSelect;

function isReportType(value: string | null): value is ReportSummaryType {
  return REPORT_TYPES.includes(value as ReportSummaryType);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseDateOrNull(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parsePage(raw: string | null): number {
  const value = Number.parseInt(raw ?? '1', 10);
  return Number.isNaN(value) || value < 1 ? 1 : value;
}

function parsePageSize(raw: string | null, exporting: boolean): number {
  if (exporting) return EXPORT_MAX;
  const value = Number.parseInt(raw ?? String(DEFAULT_PAGE_SIZE), 10);
  if (Number.isNaN(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(value, 1), MAX_PAGE_SIZE);
}

function parseProductTypeIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function buildPurchaseWhere(
  startDate: Date,
  endDate: Date,
  productTypeIds: string[],
): Prisma.PurchaseWhereInput {
  const where: Prisma.PurchaseWhereInput = {
    date: { gte: startDate, lte: endDate },
  };
  if (productTypeIds.length === 1) {
    where.productTypeId = productTypeIds[0];
  } else if (productTypeIds.length > 1) {
    where.productTypeId = { in: productTypeIds };
  }
  return where;
}

function buildExpenseWhere(startDate: Date, endDate: Date): Prisma.ExpenseWhereInput {
  return {
    date: { gte: startDate, lte: endDate },
  };
}

async function dailyPurchaseReport(
  where: Prisma.PurchaseWhereInput,
  page: number,
  pageSize: number,
) {
  const skip = (page - 1) * pageSize;
  const [rows, totals] = await Promise.all([
    prisma.purchase.findMany({
      where,
      select: purchaseRowSelect,
      orderBy: { date: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.purchase.aggregate({
      where,
      _count: { _all: true },
      _sum: { dryWeight: true, totalAmount: true },
    }),
  ]);

  const total = totals._count._all;
  return {
    rows,
    total,
    totals: {
      count: total,
      totalAmount: totals._sum.totalAmount ?? 0,
      totalWeight: totals._sum.dryWeight ?? 0,
    },
  };
}

async function memberSummaryReport(
  where: Prisma.PurchaseWhereInput,
  page: number,
  pageSize: number,
) {
  const [groups, totals] = await Promise.all([
    prisma.purchase.groupBy({
      by: ['memberId'],
      where,
      _count: { _all: true },
      _sum: { dryWeight: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
    }),
    prisma.purchase.aggregate({
      where,
      _count: { _all: true },
      _sum: { dryWeight: true, totalAmount: true },
    }),
  ]);

  const skip = (page - 1) * pageSize;
  const pageGroups = groups.slice(skip, skip + pageSize);
  const memberIds = pageGroups.map((group) => group.memberId);
  const members =
    memberIds.length === 0
      ? []
      : await prisma.member.findMany({
          where: { id: { in: memberIds } },
          select: { id: true, name: true },
        });
  const memberById = new Map(members.map((member) => [member.id, member]));

  const rows = pageGroups.map((group) => ({
    member: memberById.get(group.memberId) ?? { id: group.memberId, name: '-' },
    count: group._count._all,
    totalWeight: group._sum.dryWeight ?? 0,
    totalAmount: group._sum.totalAmount ?? 0,
  }));

  return {
    rows,
    total: groups.length,
    totals: {
      count: groups.length,
      totalAmount: totals._sum.totalAmount ?? 0,
      totalWeight: totals._sum.dryWeight ?? 0,
      purchaseCount: totals._count._all,
    },
  };
}

async function expenseSummaryReport(
  where: Prisma.ExpenseWhereInput,
  page: number,
  pageSize: number,
) {
  const skip = (page - 1) * pageSize;
  const [rows, totals, categoryGroups] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: expenseRowSelect,
      orderBy: { date: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.expense.aggregate({
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where,
      _count: { _all: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
  ]);

  const total = totals._count._all;
  return {
    rows,
    total,
    categorySummary: categoryGroups.map((group) => ({
      category: group.category,
      count: group._count._all,
      totalAmount: group._sum.amount ?? 0,
    })),
    totals: {
      count: total,
      totalAmount: totals._sum.amount ?? 0,
      totalWeight: 0,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    if (!isReportType(typeParam)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    const parsedStart = parseDateOrNull(searchParams.get('startDate'));
    const parsedEnd = parseDateOrNull(searchParams.get('endDate'));
    if (!parsedStart || !parsedEnd) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const startDate = startOfDay(parsedStart);
    const endDate = endOfDay(parsedEnd);
    if (startDate > endDate) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    const exporting = searchParams.get('export') === '1' || searchParams.get('export') === 'true';
    const page = exporting ? 1 : parsePage(searchParams.get('page'));
    const pageSize = parsePageSize(searchParams.get('pageSize'), exporting);
    const productTypeIds = parseProductTypeIds(searchParams.get('productTypeIds'));

    logger.info('GET /api/reports/summary', {
      type: typeParam,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      page,
      pageSize,
      exporting,
    });

    let payload: {
      rows: unknown[];
      total: number;
      totals: { count: number; totalAmount: number; totalWeight: number; purchaseCount?: number };
      categorySummary?: Array<{ category: string; count: number; totalAmount: number }>;
    };

    if (typeParam === 'daily_purchase') {
      payload = await dailyPurchaseReport(
        buildPurchaseWhere(startDate, endDate, productTypeIds),
        page,
        pageSize,
      );
    } else if (typeParam === 'member_summary') {
      payload = await memberSummaryReport(
        buildPurchaseWhere(startDate, endDate, productTypeIds),
        page,
        pageSize,
      );
    } else {
      payload = await expenseSummaryReport(buildExpenseWhere(startDate, endDate), page, pageSize);
    }

    const truncated = exporting && payload.total > pageSize;
    const totalPages = Math.max(1, Math.ceil(payload.total / pageSize));

    return NextResponse.json({
      type: typeParam,
      page,
      pageSize,
      total: payload.total,
      totalPages,
      truncated,
      rows: payload.rows,
      totals: payload.totals,
      categorySummary: payload.categorySummary ?? [],
    });
  } catch (error) {
    logger.error('GET /api/reports/summary - Failed', error);
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 });
  }
}
