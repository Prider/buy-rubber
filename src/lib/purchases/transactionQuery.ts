import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const DEFAULT_TRANSACTION_DATE_RANGE_DAYS = 90;

export interface TransactionQueryFilters {
  startDate: Date;
  endDate: Date;
  memberId?: string;
  searchTerm?: string;
  searchMemberIds?: string[];
}

export interface TransactionGroupSummary {
  purchaseNo: string;
  memberId: string;
  maxCreatedAt: Date | null;
  maxDate: Date | null;
  sumTotalAmount: number;
}

export function resolveDefaultDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DEFAULT_TRANSACTION_DATE_RANGE_DAYS);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}

export function parseTransactionDateRange(
  startDateParam: string | null,
  endDateParam: string | null,
): { startDate: Date; endDate: Date } {
  if (!startDateParam && !endDateParam) {
    return resolveDefaultDateRange();
  }

  const startDate = startDateParam ? new Date(startDateParam) : new Date(0);
  const endDate = endDateParam ? new Date(endDateParam) : new Date();

  if (startDateParam) {
    startDate.setHours(0, 0, 0, 0);
  }
  if (endDateParam) {
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

export function buildTransactionPrismaWhere(
  filters: TransactionQueryFilters,
): Prisma.PurchaseWhereInput {
  const where: Prisma.PurchaseWhereInput = {
    date: {
      gte: filters.startDate,
      lte: filters.endDate,
    },
  };

  if (filters.memberId) {
    where.memberId = filters.memberId;
  }

  if (filters.searchTerm) {
    const orConditions: Prisma.PurchaseWhereInput[] = [
      { purchaseNo: { contains: filters.searchTerm } },
    ];

    if (!filters.memberId && filters.searchMemberIds && filters.searchMemberIds.length > 0) {
      orConditions.push({ memberId: { in: filters.searchMemberIds } });
    }

    where.OR = orConditions;
  }

  return where;
}

function buildTransactionWhereSql(filters: TransactionQueryFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [
    Prisma.sql`"date" >= ${filters.startDate}`,
    Prisma.sql`"date" <= ${filters.endDate}`,
  ];

  if (filters.memberId) {
    parts.push(Prisma.sql`"memberId" = ${filters.memberId}`);
  }

  if (filters.searchTerm) {
    const purchaseNoPattern = `%${filters.searchTerm}%`;

    if (filters.memberId) {
      parts.push(Prisma.sql`"purchaseNo" LIKE ${purchaseNoPattern}`);
    } else if (filters.searchMemberIds && filters.searchMemberIds.length > 0) {
      parts.push(
        Prisma.sql`("purchaseNo" LIKE ${purchaseNoPattern} OR "memberId" IN (${Prisma.join(filters.searchMemberIds)}))`,
      );
    } else {
      parts.push(Prisma.sql`"purchaseNo" LIKE ${purchaseNoPattern}`);
    }
  }

  return Prisma.sql`WHERE ${Prisma.join(parts, ' AND ')}`;
}

function toNumber(value: number | bigint | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return typeof value === 'bigint' ? Number(value) : Number(value);
}

function toDateValue(value: Date | string | number | bigint | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'bigint') {
    return new Date(Number(value));
  }

  return new Date(value);
}

function mapGroupRow(row: {
  purchaseNo: string;
  memberId: string;
  maxCreatedAt: Date | string | number | bigint | null;
  maxDate: Date | string | number | bigint | null;
  sumTotalAmount: number | bigint | null;
}): TransactionGroupSummary {
  return {
    purchaseNo: row.purchaseNo,
    memberId: row.memberId,
    maxCreatedAt: toDateValue(row.maxCreatedAt),
    maxDate: toDateValue(row.maxDate),
    sumTotalAmount: toNumber(row.sumTotalAmount),
  };
}

export const SEARCH_MEMBER_ID_LIMIT = 50;

export async function resolveSearchMemberIds(
  searchTerm: string | null | undefined,
  memberId: string | null | undefined,
): Promise<string[] | undefined> {
  if (!searchTerm || memberId) {
    return undefined;
  }

  const matchingMembers = await prisma.member.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm } },
        { code: { contains: searchTerm } },
      ],
    },
    select: { id: true },
    take: SEARCH_MEMBER_ID_LIMIT,
    orderBy: { code: 'asc' },
  });

  return matchingMembers.map((member) => member.id);
}

export async function countTransactionGroups(filters: TransactionQueryFilters): Promise<number> {
  const whereSql = buildTransactionWhereSql(filters);
  const result = await prisma.$queryRaw<Array<{ count: bigint | number }>>(
    Prisma.sql`
      SELECT COUNT(*) AS count
      FROM (
        SELECT 1
        FROM "Purchase"
        ${whereSql}
        GROUP BY "purchaseNo", "memberId"
      ) AS grouped
    `,
  );

  const count = result[0]?.count ?? 0;
  return typeof count === 'bigint' ? Number(count) : Number(count);
}

export async function fetchPaginatedTransactionGroups(
  filters: TransactionQueryFilters,
  page: number,
  limit: number,
): Promise<TransactionGroupSummary[]> {
  const whereSql = buildTransactionWhereSql(filters);
  const skip = (page - 1) * limit;

  const rows = await prisma.$queryRaw<
    Array<{
      purchaseNo: string;
      memberId: string;
      maxCreatedAt: Date | string | null;
      maxDate: Date | string | null;
      sumTotalAmount: number | bigint | null;
    }>
  >(
    Prisma.sql`
      SELECT
        "purchaseNo" AS "purchaseNo",
        "memberId" AS "memberId",
        MAX("createdAt") AS "maxCreatedAt",
        MAX("date") AS "maxDate",
        SUM("totalAmount") AS "sumTotalAmount"
      FROM "Purchase"
      ${whereSql}
      GROUP BY "purchaseNo", "memberId"
      ORDER BY MAX("createdAt") DESC, MAX("date") DESC, "purchaseNo" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `,
  );

  return rows.map(mapGroupRow);
}

export const purchaseTransactionInclude = {
  member: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  productType: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} satisfies Prisma.PurchaseInclude;

export const serviceFeeTransactionSelect = {
  id: true,
  purchaseNo: true,
  category: true,
  amount: true,
  notes: true,
} satisfies Prisma.ServiceFeeSelect;
