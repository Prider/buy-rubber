import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';
// Force dynamic rendering - prevent caching in Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/dashboard - ดึงข้อมูลสำหรับแดชบอร์ด
export async function GET(_request: NextRequest) {
  try {
    logger.info('GET /api/dashboard - Request received');
    
    // Calculate "today" in Thailand timezone (UTC+7) to match expense calculations
    // This ensures consistency between dashboard and expenses pages
    const now = new Date();
    // Get current time in Thailand (UTC+7)
    const thailandOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const thailandTime = new Date(now.getTime() + thailandOffset);
    
    // Set to start of day in Thailand timezone
    const today = new Date(Date.UTC(
      thailandTime.getUTCFullYear(),
      thailandTime.getUTCMonth(),
      thailandTime.getUTCDate(),
      0, 0, 0, 0
    ));
    // Convert back to UTC for database queries
    today.setTime(today.getTime() - thailandOffset);
    
    const tomorrow = new Date(today);
    tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);

    // Calculate month boundaries in Thailand timezone
    const thailandMonthStart = new Date(Date.UTC(
      thailandTime.getUTCFullYear(),
      thailandTime.getUTCMonth(),
      1,
      0, 0, 0, 0
    ));
    thailandMonthStart.setTime(thailandMonthStart.getTime() - thailandOffset);
    
    const firstDayOfNextMonth = new Date(Date.UTC(
      thailandTime.getUTCFullYear(),
      thailandTime.getUTCMonth() + 1,
      1,
      0, 0, 0, 0
    ));
    firstDayOfNextMonth.setTime(firstDayOfNextMonth.getTime() - thailandOffset);

    // Batch 1: Execute all independent queries in parallel
    // This reduces 14+ sequential queries to 1 parallel batch
    const [
      todayPurchases,
      monthPurchases,
      totalMembers,
      activeMembers,
      recentPurchases,
      topMembers,
      todayPrices,
      productTypes,
      todayExpenses,
      monthExpenses,
      recentExpenses,
      todayPurchasesByProductType,
      todayServiceFees,
      monthServiceFees,
    ] = await Promise.all([
      // รายการรับซื้อวันนี้
      prisma.purchase.aggregate({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),
      // รายการรับซื้อเดือนนี้
      prisma.purchase.aggregate({
        where: {
          date: {
            gte: thailandMonthStart,
            lt: firstDayOfNextMonth,
          },
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),
      // จำนวนสมาชิกทั้งหมด
      prisma.member.count(),
      // จำนวนสมาชิกที่ใช้งาน
      prisma.member.count({
        where: { isActive: true },
      }),
      // รายการรับซื้อล่าสุด 10 รายการ
      prisma.purchase.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          member: true,
          productType: true,
        },
      }),
      // สมาชิกที่รับซื้อมากที่สุด (เดือนนี้)
      prisma.purchase.groupBy({
        by: ['memberId'],
        where: {
          date: {
            gte: thailandMonthStart,
            lt: firstDayOfNextMonth,
          },
        },
        _sum: {
          totalAmount: true,
          dryWeight: true,
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 5,
      }),
      // ดึงข้อมูลราคาวันนี้
      prisma.productPrice.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          productType: true,
        },
        orderBy: {
          productType: {
            name: 'asc',
          },
        },
      }),
      // ดึงข้อมูลประเภทสินค้าทั้งหมด
      prisma.productType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      // ดึงข้อมูลค่าใช้จ่ายวันนี้
      prisma.expense.aggregate({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),
      // ดึงข้อมูลค่าใช้จ่ายเดือนนี้
      prisma.expense.aggregate({
        where: {
          date: {
            gte: thailandMonthStart,
            lt: firstDayOfNextMonth,
          },
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),
      // ดึงค่าใช้จ่ายล่าสุด 5 รายการ
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: 'desc' },
      }),
      // รายการรับซื้อวันนี้แยกตามประเภทสินค้า
      prisma.purchase.groupBy({
        by: ['productTypeId'],
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: true,
        _sum: {
          totalAmount: true,
          dryWeight: true,
        },
      }),
      // ดึงข้อมูลค่าบริการวันนี้
      prisma.serviceFee.aggregate({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),
      // ดึงข้อมูลค่าบริการเดือนนี้
      prisma.serviceFee.aggregate({
        where: {
          date: {
            gte: thailandMonthStart,
            lt: firstDayOfNextMonth,
          },
        },
        _count: true,
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Batch 2: Fetch member details for top members (depends on topMembers from batch 1)
    const topMembersWithDetails = await Promise.all(
      topMembers.map(async (tm) => {
        const member = await prisma.member.findUnique({
          where: { id: tm.memberId },
        });
        return {
          member,
          totalAmount: tm._sum.totalAmount || 0,
          totalWeight: tm._sum.dryWeight || 0,
        };
      })
    );

    // Batch 3: Enrich todayPurchasesByProductType with product type details
    const todayPurchasesByProductTypeWithDetails = await Promise.all(
      todayPurchasesByProductType.map(async (pt) => {
        const productType = await prisma.productType.findUnique({
          where: { id: pt.productTypeId || '' },
        });
        return {
          productTypeId: pt.productTypeId,
          productTypeName: productType?.name || 'ไม่ระบุ',
          productTypeCode: productType?.code || '',
          count: pt._count,
          totalAmount: pt._sum.totalAmount || 0,
          totalWeight: pt._sum.dryWeight || 0,
        };
      })
    );

    logger.info('GET /api/dashboard - Success', {
      todayPurchases: todayPurchases._count,
      monthPurchases: monthPurchases._count
    });
    
    const responseData = {
      stats: {
        todayPurchases: todayPurchases._count,
        todayAmount: todayPurchases._sum.totalAmount || 0,
        monthPurchases: monthPurchases._count,
        monthAmount: monthPurchases._sum.totalAmount || 0,
        totalMembers,
        activeMembers,
        todayExpenses: todayExpenses._count,
        todayExpenseAmount: todayExpenses._sum.amount || 0,
        monthExpenses: monthExpenses._count,
        monthExpenseAmount: monthExpenses._sum.amount || 0,
        todayServiceFees: todayServiceFees._count,
        todayServiceFeeAmount: todayServiceFees._sum.amount || 0,
        monthServiceFees: monthServiceFees._count,
        monthServiceFeeAmount: monthServiceFees._sum.amount || 0,
        todayPurchasesByProductType: todayPurchasesByProductTypeWithDetails,
      },
      recentPurchases,
      topMembers: topMembersWithDetails,
      todayPrices,
      productTypes,
      recentExpenses,
    };
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    logger.error('GET /api/dashboard - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

