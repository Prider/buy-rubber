import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const fetchAll = searchParams.get('fetchAll') === 'true';
    const requestedLimit = parseInt(searchParams.get('limit') || '10');
    const limit = Number.isNaN(requestedLimit) || requestedLimit <= 0 ? 10 : requestedLimit;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const productTypeId = searchParams.get('productTypeId');

    const skip = fetchAll ? 0 : (page - 1) * limit;

    // Build where clause
    const where: any = {
      memberId: params.id,
    };

    // Date filtering
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Product type filtering
    if (productTypeId) {
      where.productTypeId = productTypeId;
    }

    // Get total count
    const total = await prisma.purchase.count({ where });
    const take = fetchAll ? (total === 0 ? 0 : total) : limit;

    // Get purchases
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        productType: true,
        member: true,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take,
    });

    // Calculate summary statistics
    const summaryData = await prisma.purchase.aggregate({
      where,
      _sum: {
        netWeight: true,
        totalAmount: true,
        basePrice: true,
      },
      _count: {
        id: true,
      },
    });

    const summary = {
      totalPurchases: summaryData._count.id || 0,
      totalAmount: summaryData._sum.totalAmount || 0,
      totalWeight: summaryData._sum.netWeight || 0,
      avgPrice: summaryData._count.id > 0 && summaryData._sum.netWeight
        ? (summaryData._sum.totalAmount || 0) / (summaryData._sum.netWeight || 1)
        : 0,
    };

    const pagination = fetchAll
      ? {
          page: 1,
          limit: total,
          total,
          totalPages: total > 0 ? 1 : 0,
          hasMore: false,
        }
      : {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        };

    return NextResponse.json({
      purchases,
      summary,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching member purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member purchases' },
      { status: 500 }
    );
  }
}

