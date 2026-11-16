import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import { diffFields } from '@/lib/activityLogShared';
import {
  findDuplicateSellingTypeName,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const data = await request.json();
    const existing = await prisma.sellingType.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบรูปแบบการขาย' }, { status: 404 });
    }

    const name = normalizeSellingTypeName(data.name);
    const nameError = sellingTypeNameError(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const types = await prisma.sellingType.findMany({
      select: { id: true, name: true },
    });
    if (findDuplicateSellingTypeName(types, name, params.id)) {
      return NextResponse.json({ error: 'มีรูปแบบการขายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }

    const type = await prisma.sellingType.update({
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
      entityType: 'sellingType',
      entityId: type.id,
      entityLabel: type.name,
      summary: `แก้รูปแบบการขาย ${type.name}`,
      changes: diffFields(
        { name: existing.name, sortOrder: existing.sortOrder, isActive: existing.isActive },
        { name: type.name, sortOrder: type.sortOrder, isActive: type.isActive },
        ['name', 'sortOrder', 'isActive'],
      ),
    });

    logger.info('PUT /api/selling-types/[id] - Success', { id: params.id });
    return NextResponse.json(serializeType(type));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'มีรูปแบบการขายชื่อนี้อยู่แล้ว' }, { status: 400 });
    }
    logger.error('PUT /api/selling-types/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขรูปแบบการขาย' },
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
    const existing = await prisma.sellingType.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบรูปแบบการขาย' }, { status: 404 });
    }

    await prisma.sellingType.delete({
      where: { id: params.id },
    });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'delete',
      entityType: 'sellingType',
      entityId: existing.id,
      entityLabel: existing.name,
      summary: `ลบรูปแบบการขาย ${existing.name}`,
      changes: { name: existing.name, soft: false },
    });

    logger.info('DELETE /api/selling-types/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบรูปแบบการขายเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/selling-types/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรูปแบบการขาย' },
      { status: 500 },
    );
  }
}
