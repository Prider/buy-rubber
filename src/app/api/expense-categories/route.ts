import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import {
  EXPENSE_CATEGORIES_INITIALIZED_KEY,
  findDuplicateExpenseCategoryName,
  mergeExpenseCategoryNames,
  normalizeExpenseCategoryName,
  expenseCategoryNameError,
} from '@/lib/expenseCategories';

export const runtime = 'nodejs';

function serializeCategory(category: {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

async function resolveCategoryName(nameInput: unknown, ignoreId?: string) {
  const name = normalizeExpenseCategoryName(nameInput);
  const nameError = expenseCategoryNameError(name);
  if (nameError) {
    return { error: nameError };
  }

  const existing = await prisma.expenseCategory.findMany({
    select: { id: true, name: true },
  });
  if (findDuplicateExpenseCategoryName(existing, name, ignoreId)) {
    return { error: 'มีประเภทค่าใช้จ่ายชื่อนี้อยู่แล้ว' };
  }

  return { name };
}

async function ensureExpenseCategories() {
  const marker = await prisma.setting.findUnique({
    where: { key: EXPENSE_CATEGORIES_INITIALIZED_KEY },
  });
  if (marker) {
    return;
  }

  const existingCount = await prisma.expenseCategory.count();
  if (existingCount === 0) {
    const used = await prisma.expense.findMany({
      distinct: ['category'],
      select: { category: true },
    });
    const names = mergeExpenseCategoryNames(used.map((row) => row.category));
    if (names.length > 0) {
      try {
        await prisma.expenseCategory.createMany({
          data: names.map((name, index) => ({ name, sortOrder: index })),
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }
  }

  await prisma.setting.upsert({
    where: { key: EXPENSE_CATEGORIES_INITIALIZED_KEY },
    update: { value: '1' },
    create: { key: EXPENSE_CATEGORIES_INITIALIZED_KEY, value: '1' },
  });
}

export async function GET(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === '1';

    logger.info('GET /api/expense-categories', { includeInactive });

    await ensureExpenseCategories();

    const categories = await prisma.expenseCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(categories.map(serializeCategory));
  } catch (error) {
    logger.error('GET /api/expense-categories - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const data = await request.json();
    const validation = await resolveCategoryName(data.name);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const last = await prisma.expenseCategory.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : (last._max.sortOrder ?? -1) + 1;

    const category = await prisma.expenseCategory.create({
      data: {
        name: validation.name,
        sortOrder,
      },
    });

    logger.info('POST /api/expense-categories - Success', { id: category.id });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'create',
      entityType: 'expenseCategory',
      entityId: category.id,
      entityLabel: category.name,
      summary: `สร้างประเภทค่าใช้จ่าย ${category.name}`,
      changes: { name: category.name },
    });

    return NextResponse.json(serializeCategory(category), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีประเภทค่าใช้จ่ายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('POST /api/expense-categories - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างประเภทค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}
