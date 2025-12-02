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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    logger.info('GET /api/purchases/transactions', { startDate, endDate, memberId, page, limit });

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

    // Get all purchases with related data
    const purchases = await prisma.purchase.findMany({
      where,
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

    // Get all service fees for these purchases
    const purchaseNos = purchases.map(p => p.purchaseNo);
    const serviceFees = purchaseNos.length > 0 ? await prisma.serviceFee.findMany({
      where: {
        purchaseNo: {
          in: purchaseNos,
        },
      },
      orderBy: {
        date: 'desc',
      },
    }) : [];

    // Group purchases by purchaseNo
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

    // Convert to array and sort by date and time (most recent first)
    const allTransactions = Array.from(transactionsMap.values()).sort((a, b) => {
      // First sort by createdAt (descending - most recent first) if available
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      
      // If times are equal, sort by date (descending)
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      
      if (aDate !== bDate) {
        return bDate - aDate;
      }
      
      // Finally, sort by purchaseNo (descending) as tiebreaker
      return b.purchaseNo.localeCompare(a.purchaseNo);
    });

    // Calculate pagination
    const total = allTransactions.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const transactions = allTransactions.slice(skip, skip + limit);

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

