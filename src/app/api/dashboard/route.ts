import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/dashboard - ดึงข้อมูลสำหรับแดชบอร์ด
export async function GET(_request: NextRequest) {
  try {
    logger.info('GET /api/dashboard - Request received');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // รายการรับซื้อวันนี้
    const todayPurchases = await prisma.purchase.aggregate({
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
    });

    // รายการรับซื้อเดือนนี้
    const monthPurchases = await prisma.purchase.aggregate({
      where: {
        date: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    // จำนวนสมาชิก
    const totalMembers = await prisma.member.count();
    const activeMembers = await prisma.member.count({
      where: { isActive: true },
    });

    // ยอดเงินล่วงหน้ารวม
    const totalAdvanceResult = await prisma.member.aggregate({
      _sum: {
        advanceBalance: true,
      },
    });

    // ยอดค้างจ่าย
    const unpaidAmount = await prisma.purchase.aggregate({
      where: {
        isPaid: false,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // รายการรับซื้อล่าสุด 10 รายการ
    const recentPurchases = await prisma.purchase.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        member: true,
        productType: true,
      },
    });

    // สมาชิกที่รับซื้อมากที่สุด (เดือนนี้)
    const topMembers = await prisma.purchase.groupBy({
      by: ['memberId'],
      where: {
        date: {
          gte: firstDayOfMonth,
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
    });

    // ดึงข้อมูลสมาชิก
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

    // ดึงข้อมูลราคาวันนี้
    const todayPrices = await prisma.productPrice.findMany({
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
    });

    // ดึงข้อมูลประเภทสินค้าทั้งหมด
    const productTypes = await prisma.productType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // ดึงข้อมูลค่าใช้จ่ายวันนี้
    const todayExpenses = await prisma.expense.aggregate({
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
    });

    // ดึงข้อมูลค่าใช้จ่ายเดือนนี้
    const monthExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      _count: true,
      _sum: {
        amount: true,
      },
    });

    // ดึงค่าใช้จ่ายล่าสุด 5 รายการ
    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { date: 'desc' },
    });

    logger.info('GET /api/dashboard - Success', {
      todayPurchases: todayPurchases._count,
      monthPurchases: monthPurchases._count
    });
    
    return NextResponse.json({
      stats: {
        todayPurchases: todayPurchases._count,
        todayAmount: todayPurchases._sum.totalAmount || 0,
        monthPurchases: monthPurchases._count,
        monthAmount: monthPurchases._sum.totalAmount || 0,
        totalMembers,
        activeMembers,
        totalAdvance: totalAdvanceResult._sum.advanceBalance || 0,
        unpaidAmount: unpaidAmount._sum.totalAmount || 0,
        todayExpenses: todayExpenses._count,
        todayExpenseAmount: todayExpenses._sum.amount || 0,
        monthExpenses: monthExpenses._count,
        monthExpenseAmount: monthExpenses._sum.amount || 0,
      },
      recentPurchases,
      topMembers: topMembersWithDetails,
      todayPrices,
      productTypes,
      recentExpenses,
    });
  } catch (error) {
    logger.error('GET /api/dashboard - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

