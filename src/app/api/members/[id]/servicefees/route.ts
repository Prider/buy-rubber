import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/members/[id]/servicefees - Get service fees for a member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const fetchAll = searchParams.get('fetchAll') === 'true';

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสมาชิก' },
        { status: 404 }
      );
    }

    // Get all purchase numbers for this member
    const memberPurchases = await prisma.purchase.findMany({
      where: { memberId },
      select: { purchaseNo: true },
      distinct: ['purchaseNo'],
    });

    const purchaseNos = memberPurchases.map(p => p.purchaseNo);

    // Build where clause for service fees
    const where: any = {
      purchaseNo: {
        in: purchaseNos,
      },
    };

    // Add date filters
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Fetch service fees
    if (fetchAll) {
      const serviceFees = await prisma.serviceFee.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      // Calculate summary
      const totalAmount = serviceFees.reduce((sum, fee) => sum + fee.amount, 0);
      const categorySummary = serviceFees.reduce((acc: any, fee) => {
        if (!acc[fee.category]) {
          acc[fee.category] = { count: 0, amount: 0 };
        }
        acc[fee.category].count++;
        acc[fee.category].amount += fee.amount;
        return acc;
      }, {});

      return NextResponse.json({
        serviceFees,
        summary: {
          totalRecords: serviceFees.length,
          totalAmount,
          categorySummary,
        },
      });
    }

    // Paginated results
    const skip = (page - 1) * limit;
    const [serviceFees, totalRecords] = await Promise.all([
      prisma.serviceFee.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.serviceFee.count({ where }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    // Calculate summary for all records (not just current page)
    const allServiceFees = await prisma.serviceFee.findMany({
      where,
      select: {
        amount: true,
        category: true,
      },
    });

    const totalAmount = allServiceFees.reduce((sum, fee) => sum + fee.amount, 0);
    const categorySummary = allServiceFees.reduce((acc: any, fee) => {
      if (!acc[fee.category]) {
        acc[fee.category] = { count: 0, amount: 0 };
      }
      acc[fee.category].count++;
      acc[fee.category].amount += fee.amount;
      return acc;
    }, {});

    return NextResponse.json({
      serviceFees,
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords,
      },
      summary: {
        totalRecords,
        totalAmount,
        categorySummary,
      },
    });
  } catch (error) {
    logger.error('Failed to get member service fees', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าบริการ' },
      { status: 500 }
    );
  }
}

