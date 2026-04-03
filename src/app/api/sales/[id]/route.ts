import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reverseSaleFromStock } from '@/lib/stock/stockService';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });

    if (!sale) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการขาย' }, { status: 404 });
    }

    if (!data.companyName || !String(data.companyName).trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อบริษัทปลายทาง' }, { status: 400 });
    }
    if (!data.productTypeId) {
      return NextResponse.json({ error: 'กรุณาเลือกประเภทสินค้า' }, { status: 400 });
    }
    if (!data.weight || Number(data.weight) <= 0) {
      return NextResponse.json({ error: 'กรุณาระบุน้ำหนักที่ขาย' }, { status: 400 });
    }
    if (data.pricePerUnit === undefined || data.pricePerUnit === null || Number(data.pricePerUnit) <= 0) {
      return NextResponse.json({ error: 'กรุณาระบุราคา' }, { status: 400 });
    }
    if (!data.sellingType) {
      return NextResponse.json({ error: 'กรุณาเลือกรูปแบบการขาย' }, { status: 400 });
    }

    const productType = await prisma.productType.findUnique({ where: { id: data.productTypeId } });
    if (!productType) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทสินค้า' }, { status: 404 });
    }

    const weight = Number(data.weight);
    const pricePerUnit = Number(data.pricePerUnit);
    const expenseCost =
      data.expenseCost === undefined || data.expenseCost === null || data.expenseCost === ''
        ? null
        : Number(data.expenseCost);

    if (expenseCost !== null && (Number.isNaN(expenseCost) || expenseCost < 0)) {
      return NextResponse.json({ error: 'ค่าใช้จ่ายไม่ถูกต้อง' }, { status: 400 });
    }

    const totalAmount = weight * pricePerUnit - (expenseCost || 0);

    const updated = await (prisma as any).sale.update({
      where: { id: params.id },
      data: {
        date: data.date ? new Date(data.date) : sale.date,
        companyName: String(data.companyName).trim(),
        productTypeId: data.productTypeId,
        weight,
        rubberPercent:
          data.rubberPercent !== '' && data.rubberPercent !== null && data.rubberPercent !== undefined
            ? Number(data.rubberPercent)
            : null,
        pricePerUnit,
        expenseType: data.expenseType ? String(data.expenseType) : null,
        expenseCost,
        sellingType: String(data.sellingType),
        totalAmount,
        notes: data.notes ? String(data.notes) : null,
      },
      include: {
        productType: true,
        user: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/sales/[id] failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขการขาย' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({ where: { id: params.id } });
    if (!sale) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการขาย' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await reverseSaleFromStock(tx, {
        productTypeId: sale.productTypeId,
        qtyKg: sale.weight,
        refNo: sale.saleNo,
        date: new Date(),
        notes: `คืนสต็อกจากการลบรายการขาย ${sale.saleNo}`,
      });
      await tx.sale.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ message: 'ลบรายการขายเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/sales/[id] failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบรายการขาย' }, { status: 500 });
  }
}
