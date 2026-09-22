import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { requireTenantAuth } from '@/lib/tenant';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const company = await prisma.destinationCompany.findUnique({
      where: { id: params.id },
    });

    if (!company || company.tenantId !== tenantId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบริษัทปลายทาง' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    logger.error('GET /api/destination-companies/[id] failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบริษัทปลายทาง' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const existing = await prisma.destinationCompany.findUnique({
      where: { id: params.id },
      select: { id: true, tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบริษัทปลายทาง' }, { status: 404 });
    }

    const data = await request.json();

    if (!data.name || !String(data.name).trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อบริษัท' }, { status: 400 });
    }

    const name = String(data.name).trim();

    const existingName = await prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>`
      SELECT id, code, name
      FROM "DestinationCompany"
      WHERE LOWER(name) = LOWER(${name})
        AND id != ${params.id}
        AND "tenantId" = ${tenantId}
      LIMIT 1
    `;

    if (existingName && existingName.length > 0) {
      const duplicate = existingName[0];
      return NextResponse.json(
        { error: `ชื่อ "${name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicate.code})` },
        { status: 400 },
      );
    }

    const company = await prisma.destinationCompany.update({
      where: { id: params.id },
      data: {
        name,
        phone: data.phone != null ? String(data.phone).trim() || null : null,
        address: data.address != null ? String(data.address).trim() || null : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });

    // Keep denormalized sale.companyName in sync when renaming
    await prisma.sale.updateMany({
      where: { tenantId, destinationCompanyId: params.id },
      data: { companyName: name },
    });

    cache.deletePattern(`^tenant:${tenantId}:destination-companies:`);

    return NextResponse.json(company);
  } catch (error) {
    logger.error('PUT /api/destination-companies/[id] failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลบริษัทปลายทาง' },
      { status: 500 },
    );
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

    const existing = await prisma.destinationCompany.findUnique({
      where: { id: params.id },
      select: { id: true, tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบริษัทปลายทาง' }, { status: 404 });
    }

    const saleCount = await prisma.sale.count({
      where: { tenantId, destinationCompanyId: params.id },
    });

    if (saleCount > 0) {
      await prisma.destinationCompany.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      cache.deletePattern(`^tenant:${tenantId}:destination-companies:`);

      return NextResponse.json({
        message: 'ปิดการใช้งานบริษัทปลายทางเรียบร้อยแล้ว',
        note: `บริษัทนี้มีประวัติการขาย ${saleCount} รายการ จึงไม่สามารถลบออกจากระบบได้ แต่จะถูกปิดการใช้งานแทน`,
        softDelete: true,
      });
    }

    try {
      await prisma.destinationCompany.delete({
        where: { id: params.id },
      });
      cache.deletePattern(`^tenant:${tenantId}:destination-companies:`);

      return NextResponse.json({
        message: 'ลบบริษัทปลายทางเรียบร้อยแล้ว',
        softDelete: false,
      });
    } catch (deleteError: unknown) {
      const err = deleteError as { code?: string; message?: string };
      if (err?.code === 'P2003' || err?.message?.includes('foreign key')) {
        await prisma.destinationCompany.update({
          where: { id: params.id },
          data: { isActive: false },
        });
        cache.deletePattern(`^tenant:${tenantId}:destination-companies:`);

        return NextResponse.json({
          message: 'ปิดการใช้งานบริษัทปลายทางเรียบร้อยแล้ว',
          note: 'ไม่สามารถลบบริษัทออกจากระบบได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง แต่จะถูกปิดการใช้งานแทน',
          softDelete: true,
        });
      }
      throw deleteError;
    }
  } catch (error) {
    logger.error('DELETE /api/destination-companies/[id] failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบบริษัทปลายทาง' },
      { status: 500 },
    );
  }
}
