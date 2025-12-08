import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// Helper function to extract user info from auth token
function getUserFromToken(request: NextRequest): { userId: string; username: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.userId && decoded.username) {
      return { userId: decoded.userId, username: decoded.username };
    }
    return null;
  } catch {
    return null;
  }
}

// GET /api/expenses
export async function GET(request: NextRequest) {
  try {
    // Verify Prisma client is available
    if (!prisma) {
      logger.error('Prisma client not initialized');
      return NextResponse.json(
        { 
          error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย',
          details: 'Database connection not available',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

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

    const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') ?? '10', 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    let pageSize = Number.isNaN(pageSizeParam) ? 10 : pageSizeParam;
    pageSize = Math.min(Math.max(pageSize, 1), 50);

    const total = await prisma.expense.count({ where });
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    const currentPage = Math.min(page, totalPages);
    const skip = total === 0 ? 0 : (currentPage - 1) * pageSize;

    // Get expenses - sorted by date (newest first), then by createdAt (most recently added first)
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [
        {
          date: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      skip,
      take: pageSize,
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
      pagination: {
        page: currentPage,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get expenses', error);
    
    // Log detailed error information for debugging
    const errorDetails = {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN_ERROR',
      name: error?.name || 'Error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    };
    
    logger.error('Expense GET error details', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย',
        details: errorDetails.message,
        code: errorDetails.code,
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails.stack }),
      },
      { status: 500 }
    );
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    logger.debug('Expense POST request data', data);
    const { category, amount, description, date, userId: providedUserId, userName: providedUserName } = data;

    // Get user info from token or use provided values
    const tokenUser = getUserFromToken(request);
    const userId = providedUserId || tokenUser?.userId;
    const userName = providedUserName || tokenUser?.username;

    // Validate user info
    if (!userId || !userName) {
      return NextResponse.json(
        { 
          error: 'ไม่พบข้อมูลผู้ใช้',
          details: 'userId and userName are required. Please ensure you are logged in.',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: 'Category is required',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (!amount || amount === 0) {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: 'Amount is required and must be greater than 0',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Parse and validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: `Invalid amount: ${amount}`,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Generate expense number
    const today = date ? new Date(date) : new Date();
    if (isNaN(today.getTime())) {
      return NextResponse.json(
        { 
          error: 'วันที่ไม่ถูกต้อง',
          details: `Invalid date: ${date}`,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

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

    logger.debug('Creating expense', { expenseNo, category, amount: parsedAmount, date: today, userId, userName });

    const expense = await prisma.expense.create({
      data: {
        expenseNo,
        date: today,
        category: category.trim(),
        amount: Math.abs(parsedAmount), // Ensure positive value
        description: description?.trim() || null,
        userId,
        userName,
      },
    });

    logger.debug('Expense created successfully', { id: expense.id });
    return NextResponse.json(expense);
  } catch (error: any) {
    logger.error('Failed to create expense', error);
    
    // Return detailed error information
    const errorResponse: any = {
      error: 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย',
      details: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN_ERROR',
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error?.stack;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}


