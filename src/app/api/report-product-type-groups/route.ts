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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === '1';

    logger.info('GET /api/report-product-type-groups', { includeInactive });

    const groups = await prisma.reportProductTypeGroup.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: groupInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(groups.map(serializeGroup));
  } catch (error) {
    logger.error('GET /api/report-product-type-groups - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มรายงาน' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const productTypeIds = parseProductTypeIds(data.productTypeIds);
    const validation = await validateProductTypeIds(productTypeIds);

    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const name = data.name != null && String(data.name).trim()
      ? String(data.name).trim()
      : null;

    const sortOrder = Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;

    const group = await prisma.reportProductTypeGroup.create({
      data: {
        name,
        sortOrder,
        productTypes: {
          create: validation.productTypeIds.map((productTypeId) => ({ productTypeId })),
        },
      },
      include: groupInclude,
    });

    logger.info('POST /api/report-product-type-groups - Success', { id: group.id });
    return NextResponse.json(serializeGroup(group), { status: 201 });
  } catch (error) {
    logger.error('POST /api/report-product-type-groups - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างกลุ่มรายงาน' },
      { status: 500 },
    );
  }
}
