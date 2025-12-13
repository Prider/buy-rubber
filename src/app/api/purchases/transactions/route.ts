import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/purchases/transactions - Get purchase transactions grouped by purchaseNo with service fees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    logger.info('GET /api/purchases/transactions', { startDate, endDate, memberId, searchTerm, page, limit });

    // Build where clause for purchases
    const where: any = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date = { ...(where.date || {}), gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...(where.date || {}), lte: end };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    // Step 1: Get distinct purchaseNos with their latest dates using database aggregation
    const purchaseNoGroups = await prisma.purchase.groupBy({
      by: ['purchaseNo', 'memberId'],
      where,
      _max: {
        createdAt: true,
        date: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Step 2: Get member info for search filtering and join with purchaseNos
    const memberIds = [...new Set(purchaseNoGroups.map(g => g.memberId))];
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, code: true },
    });
    const memberMap = new Map(members.map(m => [m.id, m]));

    // Step 3: Build transaction summaries with member info for filtering/sorting
    let transactionSummaries = purchaseNoGroups.map(group => {
      const member = memberMap.get(group.memberId);
      const maxCreatedAt = group._max.createdAt;
      const maxDate = group._max.date;
      
      // Use createdAt if available, otherwise use date
      const sortTime = maxCreatedAt 
        ? new Date(maxCreatedAt).getTime() 
        : (maxDate ? new Date(maxDate).getTime() : 0);
      
      return {
        purchaseNo: group.purchaseNo,
        memberId: group.memberId,
        member: member || null,
        date: maxDate,
        createdAt: maxCreatedAt,
        sortTime,
        totalAmount: group._sum.totalAmount || 0,
      };
    });

    // Step 4: Apply search filter at this level (before fetching full data)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      transactionSummaries = transactionSummaries.filter(summary => {
        if (!summary.member) return false;
        const purchaseNoMatch = summary.purchaseNo.toLowerCase().includes(searchLower);
        const memberNameMatch = summary.member.name.toLowerCase().includes(searchLower);
        const memberCodeMatch = summary.member.code.toLowerCase().includes(searchLower);
        return purchaseNoMatch || memberNameMatch || memberCodeMatch;
      });
    }

    // Step 5: Sort at this level (before fetching full data)
    transactionSummaries.sort((a, b) => {
      // Priority 1: Sort by sortTime (newest first)
      if (b.sortTime !== a.sortTime) {
        return b.sortTime - a.sortTime;
      }
      
      // Priority 2: Sort by date (newest first)
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      if (bDate !== aDate) {
        return bDate - aDate;
      }
      
      // Priority 3: Sort by purchaseNo (descending)
      return b.purchaseNo.localeCompare(a.purchaseNo);
    });

    // Step 6: Calculate total and paginate at this level
    const total = transactionSummaries.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedSummaries = transactionSummaries.slice(skip, skip + limit);

    // Step 7: Only now fetch full purchase data for the paginated purchaseNos
    const paginatedPurchaseNos = paginatedSummaries.map(s => s.purchaseNo);
    
    if (paginatedPurchaseNos.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    // Fetch purchases for only the paginated purchaseNos
    const purchases = await prisma.purchase.findMany({
      where: {
        ...where,
        purchaseNo: { in: paginatedPurchaseNos },
      },
      include: {
        member: true,
        productType: true,
        user: true,
      },
      orderBy: [
        { createdAt: 'desc' },
        { date: 'desc' },
        { purchaseNo: 'desc' },
      ],
    });

    // Fetch service fees for only the paginated purchaseNos
    const serviceFees = await prisma.serviceFee.findMany({
      where: {
        purchaseNo: { in: paginatedPurchaseNos },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Step 8: Group purchases by purchaseNo (only for the paginated results)
    const transactionsMap = new Map<string, {
      purchaseNo: string;
      date: Date;
      createdAt: Date;
      purchases: typeof purchases;
      serviceFees: typeof serviceFees;
      totalAmount: number;
      member: typeof purchases[0]['member'];
    }>();

    for (const purchase of purchases) {
      const existing = transactionsMap.get(purchase.purchaseNo);
      const purchaseServiceFees = serviceFees.filter(sf => sf.purchaseNo === purchase.purchaseNo);
      
      if (existing) {
        existing.purchases.push(purchase);
        existing.totalAmount += purchase.totalAmount;
        // Update to use the most recent date/createdAt
        const purchaseCreatedAt = new Date(purchase.createdAt || purchase.date).getTime();
        const existingCreatedAt = new Date(existing.createdAt || existing.date).getTime();
        if (purchaseCreatedAt > existingCreatedAt) {
          existing.createdAt = purchase.createdAt;
          existing.date = purchase.date;
        }
      } else {
        const serviceFeesTotal = purchaseServiceFees.reduce((sum, sf) => sum + sf.amount, 0);
        transactionsMap.set(purchase.purchaseNo, {
          purchaseNo: purchase.purchaseNo,
          date: purchase.date,
          createdAt: purchase.createdAt,
          purchases: [purchase],
          serviceFees: purchaseServiceFees,
          totalAmount: purchase.totalAmount - serviceFeesTotal, // Subtract service fees
          member: purchase.member,
        });
      }
    }

    // Step 9: Convert to array and maintain sort order from summaries
    const transactions = paginatedSummaries
      .map(summary => {
        const tx = transactionsMap.get(summary.purchaseNo);
        if (!tx) return undefined;
        return {
          ...tx,
          sortTime: summary.sortTime,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== undefined);


    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    };

    logger.info('GET /api/purchases/transactions - Success', { count: transactions.length, total, pagination });
    return NextResponse.json({
      transactions,
      pagination,
    });
  } catch (error) {
    logger.error('GET /api/purchases/transactions - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการรับซื้อ' },
      { status: 500 }
    );
  }
}

