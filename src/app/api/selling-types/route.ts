import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import {
  SELLING_TYPES_INITIALIZED_KEY,
  findDuplicateSellingTypeName,
  mergeSellingTypeNames,
  normalizeSellingTypeName,
  sellingTypeNameError,
} from '@/lib/sellingTypes';

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
  const name = normalizeSellingTypeName(nameInput);
  const nameError = sellingTypeNameError(name);
  if (nameError) {
    return { error: nameError };
  }

  const existing = await prisma.sellingType.findMany({
    select: { id: true, name: true },
  });
  if (findDuplicateSellingTypeName(existing, name, ignoreId)) {
    return { error: 'มีรูปแบบการขายชื่อนี้อยู่แล้ว' };
  }

  return { name };
}

async function ensureSellingTypes() {
  const marker = await prisma.setting.findUnique({
    where: { key: SELLING_TYPES_INITIALIZED_KEY },
  });
  if (marker) {
    return;
  }

  const existingCount = await prisma.sellingType.count();
  if (existingCount === 0) {
    const used = await prisma.sale.findMany({
      distinct: ['sellingType'],
      select: { sellingType: true },
    });
    const names = mergeSellingTypeNames(used.map((row) => row.sellingType));
    if (names.length > 0) {
      try {
        await prisma.sellingType.createMany({
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
    where: { key: SELLING_TYPES_INITIALIZED_KEY },
    update: { value: '1' },
    create: { key: SELLING_TYPES_INITIALIZED_KEY, value: '1' },
  });
}

export async function GET(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === '1';

    logger.info('GET /api/selling-types', { includeInactive });

    await ensureSellingTypes();

    const types = await prisma.sellingType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(types.map(serializeType));
  } catch (error) {
    logger.error('GET /api/selling-types - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปแบบการขาย' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const data = await request.json();
    const validation = await resolveTypeName(data.name);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const last = await prisma.sellingType.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : (last._max.sortOrder ?? -1) + 1;

    const type = await prisma.sellingType.create({
      data: {
        name: validation.name,
        sortOrder,
      },
    });

    logger.info('POST /api/selling-types - Success', { id: type.id });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'create',
      entityType: 'sellingType',
      entityId: type.id,
      entityLabel: type.name,
      summary: `สร้างรูปแบบการขาย ${type.name}`,
      changes: { name: type.name },
    });

    return NextResponse.json(serializeType(type), { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีรูปแบบการขายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('POST /api/selling-types - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างรูปแบบการขาย' },
      { status: 500 },
    );
  }
}
