import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import {
  SALE_EXPENSE_TYPES_INITIALIZED_KEY,
  findDuplicateSaleExpenseTypeName,
  mergeSaleExpenseTypeNames,
  normalizeSaleExpenseTypeName,
  saleExpenseTypeNameError,
} from '@/lib/saleExpenseTypes';

export const runtime = 'nodejs';

function serializeType(type: {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: type.id,
    name: type.name,
    sortOrder: type.sortOrder,
    isActive: type.isActive,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
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

async function resolveTypeName(nameInput: unknown, ignoreId?: string) {
  const name = normalizeSaleExpenseTypeName(nameInput);
  const nameError = saleExpenseTypeNameError(name);
  if (nameError) {
    return { error: nameError };
  }

  const existing = await prisma.saleExpenseType.findMany({
    select: { id: true, name: true },
  });
  if (findDuplicateSaleExpenseTypeName(existing, name, ignoreId)) {
    return { error: 'มีชนิดค่าใช้จ่ายชื่อนี้อยู่แล้ว' };
  }

  return { name };
}

async function ensureSaleExpenseTypes() {
  const marker = await prisma.setting.findUnique({
    where: { key: SALE_EXPENSE_TYPES_INITIALIZED_KEY },
  });
  if (marker) {
    return;
  }

  const existingCount = await prisma.saleExpenseType.count();
  if (existingCount === 0) {
    const [lines, legacy] = await Promise.all([
      prisma.saleExpense.findMany({
        distinct: ['type'],
        select: { type: true },
      }),
      prisma.sale.findMany({
        distinct: ['expenseType'],
        select: { expenseType: true },
      }),
    ]);
    const names = mergeSaleExpenseTypeNames([
      ...lines.map((row) => row.type),
      ...legacy.map((row) => row.expenseType),
    ]);
    if (names.length > 0) {
      try {
        await prisma.saleExpenseType.createMany({
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
    where: { key: SALE_EXPENSE_TYPES_INITIALIZED_KEY },
    update: { value: '1' },
    create: { key: SALE_EXPENSE_TYPES_INITIALIZED_KEY, value: '1' },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === '1';

    logger.info('GET /api/sale-expense-types', { includeInactive });

    await ensureSaleExpenseTypes();

    const types = await prisma.saleExpenseType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(types.map(serializeType));
  } catch (error) {
    logger.error('GET /api/sale-expense-types - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลชนิดค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const validation = await resolveTypeName(data.name);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const last = await prisma.saleExpenseType.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : (last._max.sortOrder ?? -1) + 1;

    const type = await prisma.saleExpenseType.create({
      data: {
        name: validation.name,
        sortOrder,
      },
    });

    logger.info('POST /api/sale-expense-types - Success', { id: type.id });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'create',
      entityType: 'saleExpenseType',
      entityId: type.id,
      entityLabel: type.name,
      summary: `สร้างชนิดค่าใช้จ่าย ${type.name}`,
      changes: { name: type.name },
    });

    return NextResponse.json(serializeType(type), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีชนิดค่าใช้จ่ายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('POST /api/sale-expense-types - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างชนิดค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}
