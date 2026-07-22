import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const groupInclude = {
  productTypes: {
    include: {
      productType: {
        select: { id: true, code: true, name: true, isActive: true },
      },
    },
    orderBy: { productType: { code: 'asc' as const } },
  },
} as const;

function serializeGroup(group: {
  id: string;
  name: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productTypes: Array<{
    productType: { id: string; code: string; name: string; isActive: boolean };
  }>;
}) {
  return {
    id: group.id,
    name: group.name,
    sortOrder: group.sortOrder,
    isActive: group.isActive,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    productTypes: group.productTypes.map((member) => member.productType),
  };
}

function parseProductTypeIds(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return [...new Set(data.map((id) => String(id).trim()).filter(Boolean))];
}

async function validateProductTypeIds(productTypeIds: string[]) {
  if (productTypeIds.length === 0) {
    return { error: 'กรุณาเลือกประเภทสินค้าอย่างน้อย 1 รายการ' };
  }

  const productTypes = await prisma.productType.findMany({
    where: { id: { in: productTypeIds }, isActive: true },
    select: { id: true },
  });

  if (productTypes.length !== productTypeIds.length) {
    return { error: 'พบประเภทสินค้าที่ไม่ถูกต้องหรือถูกปิดใช้งาน' };
  }

  return { productTypeIds };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json();
    const existing = await prisma.reportProductTypeGroup.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มรายงาน' }, { status: 404 });
    }

    const productTypeIds = parseProductTypeIds(data.productTypeIds);
    const validation = await validateProductTypeIds(productTypeIds);

    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const name = data.name != null && String(data.name).trim()
      ? String(data.name).trim()
      : null;

    const group = await prisma.$transaction(async (tx) => {
      await tx.reportProductTypeGroupMember.deleteMany({
        where: { groupId: params.id },
      });

      return tx.reportProductTypeGroup.update({
        where: { id: params.id },
        data: {
          name,
          sortOrder: Number.isFinite(Number(data.sortOrder))
            ? Number(data.sortOrder)
            : existing.sortOrder,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
          productTypes: {
            create: validation.productTypeIds.map((productTypeId) => ({ productTypeId })),
          },
        },
        include: groupInclude,
      });
    });

    logger.info('PUT /api/report-product-type-groups/[id] - Success', { id: params.id });
    return NextResponse.json(serializeGroup(group));
  } catch (error) {
    logger.error('PUT /api/report-product-type-groups/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขกลุ่มรายงาน' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const existing = await prisma.reportProductTypeGroup.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มรายงาน' }, { status: 404 });
    }

    await prisma.reportProductTypeGroup.delete({
      where: { id: params.id },
    });

    logger.info('DELETE /api/report-product-type-groups/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบกลุ่มรายงานเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/report-product-type-groups/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบกลุ่มรายงาน' },
      { status: 500 },
    );
  }
}
