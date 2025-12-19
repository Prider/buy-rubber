import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { getUserFromToken } from '@/lib/utils';
import { Prisma } from '@prisma/client';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// Types
interface ExpenseCreateData {
  category: string;
  amount: number | string;
  description?: string;
  date?: string;
  userId?: string;
  userName?: string;
}

interface ParsedDate {
  date: Date;
  year: number;
  month: string;
  day: string;
}

interface ExpenseSummary {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  avgDaily: number;
  avgCount: number;
}

// Constants
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const THAI_TIMEZONE_OFFSET = '+07:00';
const RANDOM_SUFFIX_LENGTH = 6;
const MAX_RETRY_ATTEMPTS = 5;
const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Helper Functions

/**
 * Validates Prisma client is available
 */
function validatePrismaClient(): void {
    if (!prisma) {
      logger.error('Prisma client not initialized');
    throw new Error('Database connection not available');
  }
}

/**
 * Parses and validates query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  startDate?: Date;
  endDate?: Date;
  category?: string;
} {
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
  
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = Math.min(Math.max(Number.isNaN(pageSizeParam) ? DEFAULT_PAGE_SIZE : pageSizeParam, 1), MAX_PAGE_SIZE);

  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const category = searchParams.get('category') || undefined;

  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? (() => {
    const date = new Date(endDateParam);
    date.setHours(23, 59, 59, 999);
    return date;
  })() : undefined;

  return { page, pageSize, startDate, endDate, category };
}

/**
 * Builds Prisma where clause for expense queries
 */
function buildWhereClause(params: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};

  if (params.startDate || params.endDate) {
      where.date = {};
    if (params.startDate) {
      where.date.gte = params.startDate;
    }
    if (params.endDate) {
      where.date.lte = params.endDate;
    }
  }

  if (params.category) {
    where.category = params.category;
  }

  return where;
}

/**
 * Calculates expense summary statistics
 */
async function calculateExpenseSummary(): Promise<ExpenseSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [todayExpenses, monthExpenses] = await Promise.all([
    prisma.expense.aggregate({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.aggregate({
      where: {
        date: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthTotal = monthExpenses._sum.amount || 0;
  const monthCount = monthExpenses._count.id || 0;
  
  const avgDaily = monthTotal && monthCount ? monthTotal / daysInMonth : 0;
  const avgCount = monthCount ? monthCount / daysInMonth : 0;

  return {
      todayTotal: todayExpenses._sum.amount || 0,
      todayCount: todayExpenses._count.id || 0,
    monthTotal,
    monthCount,
      avgDaily: Math.round(avgDaily * 100) / 100,
      avgCount: Math.round(avgCount * 100) / 100,
    };
}

/**
 * Parses date string and extracts date components
 * Handles timezone conversion for datetime-local values (assumes Thailand timezone UTC+7)
 */
function parseExpenseDate(dateString?: string): ParsedDate {
  let date: Date;
  let year: number;
  let month: string;
  let day: string;

  if (dateString) {
    // Extract date parts from original string BEFORE timezone conversion
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    
    // Check if date string has timezone info
    const hasTimezone = dateString.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(dateString);
    
    if (hasTimezone) {
      date = new Date(dateString);
    } else {
      // No timezone - assume Thailand timezone (UTC+7) for datetime-local values
      date = new Date(dateString + THAI_TIMEZONE_OFFSET);
    }
    
    // Use date parts from original string if available, otherwise extract from Date object
    if (dateMatch) {
      year = parseInt(dateMatch[1], 10);
      month = dateMatch[2];
      day = dateMatch[3];
    } else {
      year = date.getFullYear();
      month = String(date.getMonth() + 1).padStart(2, '0');
      day = String(date.getDate()).padStart(2, '0');
    }
  } else {
    date = new Date();
    year = date.getFullYear();
    month = String(date.getMonth() + 1).padStart(2, '0');
    day = String(date.getDate()).padStart(2, '0');
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return { date, year, month, day };
}

/**
 * Generates a random alphanumeric suffix for expense numbers
 */
function generateRandomSuffix(): string {
  let suffix = '';
  for (let i = 0; i < RANDOM_SUFFIX_LENGTH; i++) {
    suffix += RANDOM_CHARS.charAt(Math.floor(Math.random() * RANDOM_CHARS.length));
  }
  return suffix;
}

/**
 * Generates a random expense number
 * Format: EXP-YYYYMMDD-XXXXXX
 */
function generateExpenseNumber(prefix: string): string {
  return prefix + generateRandomSuffix();
}

/**
 * Validates expense creation data
 */
function validateExpenseData(data: ExpenseCreateData): {
  category: string;
  amount: number;
  description?: string | null;
} {
  const category = data.category?.trim();
  if (!category) {
    throw new Error('Category is required');
  }

  // Check if amount is missing or undefined
  if (data.amount === undefined || data.amount === null) {
    throw new Error('Amount is required and must be greater than 0');
  }

  // Check if amount is 0
  if (data.amount === 0) {
    throw new Error('Amount is required and must be greater than 0');
  }

  const parsedAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error(`Invalid amount: ${data.amount}`);
  }

  return {
    category,
    amount: Math.abs(parsedAmount),
    description: data.description?.trim() || null,
  };
}

/**
 * Creates error response
 */
function createErrorResponse(
  message: string,
  details: string,
  code: string,
  status: number = 500
): NextResponse {
  const errorResponse: {
    error: string;
    details: string;
    code: string;
    stack?: string;
  } = {
    error: message,
    details,
    code,
  };

  if (process.env.NODE_ENV === 'development') {
    const error = new Error(details);
    errorResponse.stack = error.stack;
  }

  return NextResponse.json(errorResponse, { status });
}

// API Handlers

/**
 * GET /api/expenses
 * Retrieves expenses with pagination and summary statistics
 */
export async function GET(request: NextRequest) {
  try {
    validatePrismaClient();

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);
    const where = buildWhereClause(params);

    // Get total count first (needed for pagination)
    const total = await prisma.expense.count({ where });

    // Execute remaining queries in parallel
    const [expenses, summary] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: total === 0 ? 0 : (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      calculateExpenseSummary(),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / params.pageSize);
    const currentPage = Math.min(params.page, totalPages);

    return NextResponse.json({
      expenses,
      summary,
      pagination: {
        page: currentPage,
        pageSize: params.pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Failed to get expenses', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string })?.code || 'UNKNOWN_ERROR';

    return createErrorResponse(
      'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย',
      errorMessage,
      errorCode,
      500
    );
  }
}

/**
 * POST /api/expenses
 * Creates a new expense
 */
export async function POST(request: NextRequest) {
  try {
    validatePrismaClient();

    const data: ExpenseCreateData = await request.json();
    logger.debug('Expense POST request data', data);

    // Get user info from token or use provided values
    const tokenUser = getUserFromToken(request);
    const userId = data.userId || tokenUser?.userId;
    const userName = data.userName || tokenUser?.username;

    if (!userId || !userName) {
      return createErrorResponse(
        'ไม่พบข้อมูลผู้ใช้',
        'userId and userName are required. Please ensure you are logged in.',
        'AUTH_ERROR',
        401
      );
    }

    // Validate expense data
    let validatedData;
    try {
      validatedData = validateExpenseData(data);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'Validation failed';
      return createErrorResponse(
        'กรุณากรอกข้อมูลให้ครบถ้วน',
        message,
        'VALIDATION_ERROR',
        400
      );
    }

    // Parse and validate date
    let parsedDate: ParsedDate;
    try {
      parsedDate = parseExpenseDate(data.date);
    } catch (dateError) {
      const message = dateError instanceof Error ? dateError.message : 'Invalid date';
      return createErrorResponse(
        'วันที่ไม่ถูกต้อง',
        message,
        'VALIDATION_ERROR',
        400
      );
    }

    // Generate expense number with retry logic for collisions
    const prefix = `EXP-${parsedDate.year}${parsedDate.month}${parsedDate.day}-`;
    let expenseNo = generateExpenseNumber(prefix);
    let expense;
    let attempts = 0;

    while (attempts < MAX_RETRY_ATTEMPTS) {
      try {
        logger.debug('Creating expense', {
          expenseNo,
          category: validatedData.category,
          amount: validatedData.amount,
          date: parsedDate.date,
          userId,
          userName,
          attempt: attempts + 1,
        });

        expense = await prisma.expense.create({
      data: {
        expenseNo,
            date: parsedDate.date,
            category: validatedData.category,
            amount: validatedData.amount,
            description: validatedData.description,
        userId,
        userName,
      },
    });

        break; // Success
      } catch (createError) {
        const prismaError = createError as { code?: string; meta?: { target?: string[] } };

        // Check if it's a unique constraint error on expenseNo
        if (prismaError?.code === 'P2002' && prismaError?.meta?.target?.includes('expenseNo')) {
          attempts++;
          if (attempts >= MAX_RETRY_ATTEMPTS) {
            throw createError;
          }
          // Generate a new expense number and retry
          expenseNo = generateExpenseNumber(prefix);
          logger.debug('Expense number collision detected, retrying with new number', {
            newExpenseNo: expenseNo,
            attempt: attempts,
          });
        } else {
          throw createError;
        }
      }
    }

    // Invalidate dashboard cache
    cache.delete(CACHE_KEYS.DASHBOARD);

    logger.debug('Expense created successfully', { id: expense!.id, expenseNo });
    return NextResponse.json(expense);
  } catch (error) {
    logger.error('Failed to create expense', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string })?.code || 'UNKNOWN_ERROR';

    return createErrorResponse(
      'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย',
      errorMessage,
      errorCode,
      500
    );
  }
}
