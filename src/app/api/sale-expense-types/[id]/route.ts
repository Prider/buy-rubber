import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import { diffFields } from '@/lib/activityLogShared';
import {
  findDuplicateSaleExpenseTypeName,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json();
    const existing = await prisma.saleExpenseType.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบชนิดค่าใช้จ่าย' }, { status: 404 });
    }

    const name = normalizeSaleExpenseTypeName(data.name);
    const nameError = saleExpenseTypeNameError(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const types = await prisma.saleExpenseType.findMany({
      select: { id: true, name: true },
    });
    if (findDuplicateSaleExpenseTypeName(types, name, params.id)) {
      return NextResponse.json({ error: 'มีชนิดค่าใช้จ่ายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }

    const type = await prisma.saleExpenseType.update({
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
      entityType: 'saleExpenseType',
      entityId: type.id,
      entityLabel: type.name,
      summary: `แก้ชนิดค่าใช้จ่าย ${type.name}`,
      changes: diffFields(
        { name: existing.name, sortOrder: existing.sortOrder, isActive: existing.isActive },
        { name: type.name, sortOrder: type.sortOrder, isActive: type.isActive },
        ['name', 'sortOrder', 'isActive'],
      ),
    });

    logger.info('PUT /api/sale-expense-types/[id] - Success', { id: params.id });
    return NextResponse.json(serializeType(type));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีชนิดค่าใช้จ่ายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('PUT /api/sale-expense-types/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขชนิดค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const existing = await prisma.saleExpenseType.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบชนิดค่าใช้จ่าย' }, { status: 404 });
    }

    await prisma.saleExpenseType.delete({
      where: { id: params.id },
    });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'delete',
      entityType: 'saleExpenseType',
      entityId: existing.id,
      entityLabel: existing.name,
      summary: `ลบชนิดค่าใช้จ่าย ${existing.name}`,
      changes: { name: existing.name, soft: false },
    });

    logger.info('DELETE /api/sale-expense-types/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบชนิดค่าใช้จ่ายเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/sale-expense-types/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบชนิดค่าใช้จ่าย' },
      { status: 500 },
    );
  }
}
