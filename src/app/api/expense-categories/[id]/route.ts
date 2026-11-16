import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import { diffFields } from '@/lib/activityLogShared';
import {
  findDuplicateExpenseCategoryName,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const data = await request.json();
    const existing = await prisma.expenseCategory.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบประเภทค่าใช้จ่าย' }, { status: 404 });
    }

    const name = normalizeExpenseCategoryName(data.name);
    const nameError = expenseCategoryNameError(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const categories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true },
    });
    if (findDuplicateExpenseCategoryName(categories, name, params.id)) {
      return NextResponse.json({ error: 'มีประเภทค่าใช้จ่ายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }

    const category = await prisma.expenseCategory.update({
      where: { id: params.id },
      data: {
        name,
        sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : existing.sortOrder,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
      },
    });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'update',
      entityType: 'expenseCategory',
      entityId: category.id,
      entityLabel: category.name,
      summary: `แก้ประเภทค่าใช้จ่าย ${category.name}`,
      changes: diffFields(
        { name: existing.name, sortOrder: existing.sortOrder, isActive: existing.isActive },
        { name: category.name, sortOrder: category.sortOrder, isActive: category.isActive },
        ['name', 'sortOrder', 'isActive'],
      ),
    });

    logger.info('PUT /api/expense-categories/[id] - Success', { id: params.id });
    return NextResponse.json(serializeCategory(category));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีประเภทค่าใช้จ่ายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('PUT /api/expense-categories/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขประเภทค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const existing = await prisma.expenseCategory.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบประเภทค่าใช้จ่าย' }, { status: 404 });
    }

    await prisma.expenseCategory.delete({
      where: { id: params.id },
    });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'delete',
      entityType: 'expenseCategory',
      entityId: existing.id,
      entityLabel: existing.name,
      summary: `ลบประเภทค่าใช้จ่าย ${existing.name}`,
      changes: { name: existing.name, soft: false },
    });

    logger.info('DELETE /api/expense-categories/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบประเภทค่าใช้จ่ายเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/expense-categories/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบประเภทค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}
