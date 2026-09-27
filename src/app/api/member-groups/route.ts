import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { logger } from '@/shared/logger';
import { cache } from '@/shared/cache';
import { requireTenantAuth } from '@/platform/tenant';
import { parseMemberGroupPrices } from '@/industries/rubber/domain/memberGroups';

export const runtime = 'nodejs';

const groupInclude = {
  prices: {
    select: { productTypeId: true, price: true },
    orderBy: { productTypeId: 'asc' as const },
  },
} as const;

function serializeGroup(group: {
  id: string;
  name: string;
  isActive: boolean;
  prices: Array<{ productTypeId: string; price: number }>;
}) {
  return {
    id: group.id,
    name: group.name,
    isActive: group.isActive,
    prices: group.prices,
  };
}

async function validatePrices(tenantId: string, productTypeIds: string[]) {
  if (productTypeIds.length === 0) return null;
  const productTypes = await prisma.productType.findMany({
    where: { tenantId, id: { in: productTypeIds } },
    select: { id: true },
  });
  if (productTypes.length !== productTypeIds.length) {
    return 'พบประเภทสินค้าที่ไม่ถูกต้อง';
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const groups = await prisma.memberGroup.findMany({
      where: { tenantId, isActive: true },
      include: groupInclude,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(groups.map(serializeGroup));
  } catch (error) {
    logger.error('GET /api/member-groups - Failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มสมาชิก' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const data = await request.json();
    const name = String(data.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อกลุ่ม' }, { status: 400 });
    }

    const parsed = parseMemberGroupPrices(data.prices);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const priceError = await validatePrices(
      tenantId,
      parsed.prices.map((price) => price.productTypeId),
    );
    if (priceError) {
      return NextResponse.json({ error: priceError }, { status: 400 });
    }

    const group = await prisma.memberGroup.create({
      data: {
        tenantId,
        name,
        prices: {
          create: parsed.prices.map((price) => ({
            tenantId,
            productTypeId: price.productTypeId,
            price: price.price,
          })),
        },
      },
      include: groupInclude,
    });

    cache.deletePattern(`^tenant:${tenantId}:members:`);
    logger.info('POST /api/member-groups - Success', { id: group.id });
    return NextResponse.json(serializeGroup(group), { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'ชื่อกลุ่มนี้มีอยู่แล้ว' }, { status: 400 });
    }
    logger.error('POST /api/member-groups - Failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างกลุ่มสมาชิก' }, { status: 500 });
  }
}
