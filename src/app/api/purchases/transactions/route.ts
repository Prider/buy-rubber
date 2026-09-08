import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { countTransactionGroupsCached } from '@/lib/purchases/transactionCountCache';
import {
  buildTransactionPrismaWhere,
  fetchPaginatedTransactionGroups,
  parseTransactionDateRange,
  purchaseTransactionInclude,
  resolveSearchMemberIds,
  serviceFeeTransactionSelect,
  type TransactionQueryFilters,
} from '@/lib/purchases/transactionQuery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/purchases/transactions - Get purchase transactions grouped by purchaseNo with service fees
export async function GET(request: NextRequest) {
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

    const [total, paginatedGroups] = await Promise.all([
      countTransactionGroupsCached(filters),
      fetchPaginatedTransactionGroups(filters, page, limit),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    if (paginatedGroups.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: { page, limit, total, totalPages, hasMore: false },
      });
    }

    const paginatedPurchaseNos = paginatedGroups.map((group) => group.purchaseNo);
    const paginatedMemberIds = [...new Set(paginatedGroups.map((group) => group.memberId))];

    const [purchases, serviceFees, members] = await Promise.all([
      prisma.purchase.findMany({
        where: {
          ...prismaWhere,
          purchaseNo: { in: paginatedPurchaseNos },
        },
        include: purchaseTransactionInclude,
        orderBy: [{ createdAt: 'desc' }, { date: 'desc' }, { purchaseNo: 'desc' }],
      }),
      prisma.serviceFee.findMany({
        where: { purchaseNo: { in: paginatedPurchaseNos } },
        select: serviceFeeTransactionSelect,
        orderBy: { date: 'desc' },
      }),
      prisma.member.findMany({
        where: { id: { in: paginatedMemberIds } },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const memberMap = new Map(members.map((member) => [member.id, member]));

    const serviceFeesByNo = new Map<string, typeof serviceFees>();
    for (const serviceFee of serviceFees) {
      if (!serviceFee.purchaseNo) continue;
      const existing = serviceFeesByNo.get(serviceFee.purchaseNo) ?? [];
      existing.push(serviceFee);
      serviceFeesByNo.set(serviceFee.purchaseNo, existing);
    }

    type TxEntry = {
      purchaseNo: string;
      date: Date;
      createdAt: Date;
      purchases: typeof purchases;
      serviceFees: typeof serviceFees;
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
        const fees = serviceFeesByNo.get(purchase.purchaseNo) ?? [];
        const serviceFeesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
        transactionsMap.set(purchase.purchaseNo, {
          purchaseNo: purchase.purchaseNo,
          date: purchase.date,
          createdAt: purchase.createdAt,
          purchases: [purchase],
          serviceFees: fees,
          totalAmount: purchase.totalAmount - serviceFeesTotal,
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
