import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { countTransactionGroupsCached } from '@/lib/purchases/transactionCountCache';
import {
  buildTransactionPrismaWhere,
  dedupeGroupsByPurchaseNo,
  fetchPaginatedTransactionGroups,
  parseTransactionDateRange,
  purchaseTransactionInclude,
  resolveSearchMemberIds,
  type TransactionQueryFilters,
} from '@/lib/purchases/transactionQuery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/purchases/transactions - Get purchase transactions grouped by purchaseNo
export async function GET(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');
    const searchTerm = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 200);

    logger.info('GET /api/purchases/transactions', {
      startDate: startDateParam,
      endDate: endDateParam,
      memberId,
      searchTerm,
      page,
      limit,
    });

    const { startDate, endDate } = parseTransactionDateRange(startDateParam, endDateParam);
    const searchMemberIds = await resolveSearchMemberIds(searchTerm, memberId);

    const filters: TransactionQueryFilters = {
      startDate,
      endDate,
      memberId: memberId || undefined,
      searchTerm: searchTerm || undefined,
      searchMemberIds,
    };

    const prismaWhere = buildTransactionPrismaWhere(filters);

    const [total, fetchedGroups] = await Promise.all([
      countTransactionGroupsCached(filters),
      fetchPaginatedTransactionGroups(filters, page, limit),
    ]);

    const paginatedGroups = dedupeGroupsByPurchaseNo(fetchedGroups);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    if (paginatedGroups.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: { page, limit, total, totalPages, hasMore: false },
      });
    }

    const paginatedPurchaseNos = paginatedGroups.map((group) => group.purchaseNo);
    const paginatedMemberIds = [...new Set(paginatedGroups.map((group) => group.memberId))];

    const [purchases, members] = await Promise.all([
      prisma.purchase.findMany({
        where: {
          ...prismaWhere,
          purchaseNo: { in: paginatedPurchaseNos },
        },
        include: purchaseTransactionInclude,
        orderBy: [{ createdAt: 'desc' }, { date: 'desc' }, { purchaseNo: 'desc' }],
      }),
      prisma.member.findMany({
        where: { id: { in: paginatedMemberIds } },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const memberMap = new Map(members.map((member) => [member.id, member]));

    type TxEntry = {
      purchaseNo: string;
      date: Date;
      createdAt: Date;
      purchases: typeof purchases;
      totalAmount: number;
      member: (typeof purchases)[0]['member'];
    };

    const transactionsMap = new Map<string, TxEntry>();
    for (const purchase of purchases) {
      const existing = transactionsMap.get(purchase.purchaseNo);
      if (existing) {
        existing.purchases.push(purchase);
        existing.totalAmount += purchase.totalAmount;
        const purchaseTime = new Date(purchase.createdAt || purchase.date).getTime();
        const existingTime = new Date(existing.createdAt || existing.date).getTime();
        if (purchaseTime > existingTime) {
          existing.createdAt = purchase.createdAt;
          existing.date = purchase.date;
        }
      } else {
        transactionsMap.set(purchase.purchaseNo, {
          purchaseNo: purchase.purchaseNo,
          date: purchase.date,
          createdAt: purchase.createdAt,
          purchases: [purchase],
          totalAmount: purchase.totalAmount,
          member: purchase.member,
        });
      }
    }

    const transactions = paginatedGroups
      .map((group) => {
        const transaction = transactionsMap.get(group.purchaseNo);
        if (!transaction) return undefined;

        return {
          ...transaction,
          member: transaction.member || memberMap.get(group.memberId) || null,
          sortTime: group.maxCreatedAt
            ? new Date(group.maxCreatedAt).getTime()
            : group.maxDate
              ? new Date(group.maxDate).getTime()
              : 0,
        };
      })
      .filter((transaction): transaction is NonNullable<typeof transaction> => transaction !== undefined);

    logger.info('GET /api/purchases/transactions - Success', { count: transactions.length, total });

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    });
  } catch (error) {
    logger.error('GET /api/purchases/transactions - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการรับซื้อ' },
      { status: 500 },
    );
  }
}
