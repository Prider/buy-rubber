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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const existing = await prisma.memberGroup.findUnique({
      where: { id: params.id },
      select: { id: true, tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มสมาชิก' }, { status: 404 });
    }

    const data = await request.json();
    const name = String(data.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อกลุ่ม' }, { status: 400 });
    }

    const parsed = parseMemberGroupPrices(data.prices);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.prices.length > 0) {
      const productTypes = await prisma.productType.findMany({
        where: { tenantId, id: { in: parsed.prices.map((price) => price.productTypeId) } },
        select: { id: true },
      });
      if (productTypes.length !== parsed.prices.length) {
        return NextResponse.json({ error: 'พบประเภทสินค้าที่ไม่ถูกต้อง' }, { status: 400 });
      }
    }

    const group = await prisma.memberGroup.update({
      where: { id: params.id },
      data: {
        name,
        prices: {
          deleteMany: {},
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
    return NextResponse.json(serializeGroup(group));
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'ชื่อกลุ่มนี้มีอยู่แล้ว' }, { status: 400 });
    }
    logger.error('PUT /api/member-groups/[id] - Failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขกลุ่มสมาชิก' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const existing = await prisma.memberGroup.findUnique({
      where: { id: params.id },
      select: { id: true, tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มสมาชิก' }, { status: 404 });
    }

    await prisma.memberGroup.delete({ where: { id: params.id } });
    cache.deletePattern(`^tenant:${tenantId}:members:`);
    return NextResponse.json({ message: 'ลบกลุ่มสมาชิกแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/member-groups/[id] - Failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบกลุ่มสมาชิก' }, { status: 500 });
  }
}
