import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET /api/expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    const where: any = {};
    
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

    if (category) {
      where.category = category;
    }

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      take: 50, // Limit to last 50 records
    });

    // Calculate summary statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's expenses
    const todayExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // This month's expenses
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate average daily expense for this month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const avgDaily = monthExpenses._sum.amount && monthExpenses._count.id
      ? monthExpenses._sum.amount / daysInMonth
      : 0;
    const avgCount = monthExpenses._count.id
      ? monthExpenses._count.id / daysInMonth
      : 0;

    const summary = {
      todayTotal: todayExpenses._sum.amount || 0,
      todayCount: todayExpenses._count.id || 0,
      monthTotal: monthExpenses._sum.amount || 0,
      monthCount: monthExpenses._count.id || 0,
      avgDaily: Math.round(avgDaily * 100) / 100,
      avgCount: Math.round(avgCount * 100) / 100,
    };

    return NextResponse.json({
      expenses,
      summary,
    });
  } catch (error) {
    logger.error('Failed to get expenses', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' },
      { status: 500 }
    );
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { category, amount, description, date } = data;

    // Validate required fields
    if (!category || !amount) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Generate expense number
    const today = new Date(date || new Date());
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Get count for today
    const todayStart = new Date(year, today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const count = await prisma.expense.count({
      where: {
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const expenseNo = `EXP-${year}${month}${day}-${String(count + 1).padStart(3, '0')}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNo,
        date: new Date(date || new Date()),
        category,
        amount: parseFloat(amount),
        description,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    logger.error('Failed to create expense', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย' },
      { status: 500 }
    );
  }
}


