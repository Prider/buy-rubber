import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import {
  findDuplicateServiceFeeCategoryName,
  normalizeServiceFeeCategoryName,
  serviceFeeCategoryNameError,
} from '@/lib/serviceFeeCategories';

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
  const name = normalizeServiceFeeCategoryName(nameInput);
  const nameError = serviceFeeCategoryNameError(name);
  if (nameError) {
    return { error: nameError };
  }

  const existing = await prisma.serviceFeeCategory.findMany({
    select: { id: true, name: true },
  });
  if (findDuplicateServiceFeeCategoryName(existing, name, ignoreId)) {
    return { error: 'มีประเภทค่าบริการชื่อนี้อยู่แล้ว' };
  }

  return { name };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === '1';

    logger.info('GET /api/service-fee-categories', { includeInactive });

    const categories = await prisma.serviceFeeCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(categories.map(serializeCategory));
  } catch (error) {
    logger.error('GET /api/service-fee-categories - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทค่าบริการ' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const validation = await resolveCategoryName(data.name);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const last = await prisma.serviceFeeCategory.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : (last._max.sortOrder ?? -1) + 1;

    const category = await prisma.serviceFeeCategory.create({
      data: {
        name: validation.name,
        sortOrder,
      },
    });

    logger.info('POST /api/service-fee-categories - Success', { id: category.id });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'create',
      entityType: 'serviceFeeCategory',
      entityId: category.id,
      entityLabel: category.name,
      summary: `สร้างประเภทค่าบริการ ${category.name}`,
      changes: { name: category.name },
    });

    return NextResponse.json(serializeCategory(category), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีประเภทค่าบริการชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('POST /api/service-fee-categories - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างประเภทค่าบริการ' },
      { status: 500 },
    );
  }
}
