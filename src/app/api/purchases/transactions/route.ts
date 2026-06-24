import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_DATE_RANGE_DAYS = 90;

// GET /api/purchases/transactions - Get purchase transactions grouped by purchaseNo with service fees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');
    const searchTerm = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 200);

    logger.info('GET /api/purchases/transactions', { startDate, endDate, memberId, searchTerm, page, limit });

    // Build base WHERE clause
    const where: Prisma.PurchaseWhereInput = {};

    if (!startDate && !endDate) {
      const defaultEndDate = new Date();
      defaultEndDate.setHours(23, 59, 59, 999);
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - DEFAULT_DATE_RANGE_DAYS);
      defaultStartDate.setHours(0, 0, 0, 0);
      where.date = { gte: defaultStartDate, lte: defaultEndDate };
    } else {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.date = dateFilter;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    // Push search into the DB: pre-fetch matching memberIds so the groupBy WHERE can filter them
    if (searchTerm) {
      const orConditions: Prisma.PurchaseWhereInput[] = [
        { purchaseNo: { contains: searchTerm } },
      ];

      // Only search by member name/code when not already filtered to a specific member
      if (!memberId) {
        const matchingMembers = await prisma.member.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm } },
              { code: { contains: searchTerm } },
            ],
          },
          select: { id: true },
        });
        if (matchingMembers.length > 0) {
          orConditions.push({ memberId: { in: matchingMembers.map((m) => m.id) } });
        }
      }

      where.OR = orConditions;
    }

    // Count and paginate entirely in the DB — no in-memory sort/filter/slice
    const [totalGroups, paginatedGroups] = await Promise.all([
      // Lightweight count: returns only {purchaseNo} per group
      prisma.purchase.groupBy({ by: ['purchaseNo'], where }),
      // Paginated result: DB applies sort and offset
      prisma.purchase.groupBy({
        by: ['purchaseNo', 'memberId'],
        where,
        _max: { createdAt: true, date: true },
        _sum: { totalAmount: true },
        orderBy: [
          { _max: { createdAt: 'desc' } },
          { _max: { date: 'desc' } },
          { purchaseNo: 'desc' },
        ],
        take: limit,
        skip: (page - 1) * limit,
      }),
    ]);

    const total = totalGroups.length;
    const totalPages = Math.ceil(total / limit);

    if (paginatedGroups.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: { page, limit, total, totalPages, hasMore: false },
      });
    }

    const paginatedPurchaseNos = paginatedGroups.map((g) => g.purchaseNo);
    const paginatedMemberIds = [...new Set(paginatedGroups.map((g) => g.memberId))];

    // Fetch full detail only for the current page (≤ limit groups)
    const [purchases, serviceFees, members] = await Promise.all([
      prisma.purchase.findMany({
        where: { purchaseNo: { in: paginatedPurchaseNos } },
        include: { member: true, productType: true, user: true },
        orderBy: [{ createdAt: 'desc' }, { date: 'desc' }, { purchaseNo: 'desc' }],
      }),
      prisma.serviceFee.findMany({
        where: { purchaseNo: { in: paginatedPurchaseNos } },
        orderBy: { date: 'desc' },
      }),
      prisma.member.findMany({
        where: { id: { in: paginatedMemberIds } },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Pre-group service fees by purchaseNo to avoid an O(n²) filter inside the loop
    const serviceFeesByNo = new Map<string, typeof serviceFees>();
    for (const sf of serviceFees) {
      if (!sf.purchaseNo) continue;
      const arr = serviceFeesByNo.get(sf.purchaseNo) ?? [];
      arr.push(sf);
      serviceFeesByNo.set(sf.purchaseNo, arr);
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
        const pTime = new Date(purchase.createdAt || purchase.date).getTime();
        const eTime = new Date(existing.createdAt || existing.date).getTime();
        if (pTime > eTime) {
          existing.createdAt = purchase.createdAt;
          existing.date = purchase.date;
        }
      } else {
        const fees = serviceFeesByNo.get(purchase.purchaseNo) ?? [];
        const serviceFeesTotal = fees.reduce((sum, sf) => sum + sf.amount, 0);
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

    // Return transactions in the DB-sorted order from paginatedGroups
    const transactions = paginatedGroups
      .map((group) => {
        const tx = transactionsMap.get(group.purchaseNo);
        if (!tx) return undefined;
        return {
          ...tx,
          member: tx.member || memberMap.get(group.memberId) || null,
          sortTime: group._max.createdAt
            ? new Date(group._max.createdAt).getTime()
            : group._max.date
              ? new Date(group._max.date).getTime()
              : 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

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
