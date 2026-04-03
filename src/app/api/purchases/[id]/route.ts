import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { calculateDryWeight, calculateSplit, getUserFromToken } from '@/lib/utils';
import {
  applyPurchaseToStock,
  reversePurchaseFromStock,
  StockInsufficientError,
} from '@/lib/stock/stockService';

export const runtime = 'nodejs';

const EPS = 1e-6;

function resolvePurchaseDate(dateInput: unknown): Date {
  if (typeof dateInput === 'string') {
    const dateOnly = new Date(dateInput);
    if (dateInput.includes('T') || /:\d{2}/.test(dateInput)) {
      return new Date(dateInput);
    }
    const now = new Date();
    return new Date(
      dateOnly.getFullYear(),
      dateOnly.getMonth(),
      dateOnly.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    );
  }
  return dateInput instanceof Date ? dateInput : new Date();
}

// PUT /api/purchases/[id] — แก้ไขรับซื้อ + ปรับสต็อกเมื่อ น้ำหนัก / ราคา / ประเภท เปลี่ยน
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const tokenUser = getUserFromToken(request);
    const userId = data.userId || tokenUser?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้', details: 'userId is required' },
        { status: 401 }
      );
    }

    const existing = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: { member: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการรับซื้อ' }, { status: 404 });
    }

    if (!data.memberId) {
      return NextResponse.json({ error: 'กรุณาเลือกสมาชิก' }, { status: 400 });
    }
    if (!data.productTypeId) {
      return NextResponse.json({ error: 'กรุณาเลือกประเภทสินค้า' }, { status: 400 });
    }
    if (!data.date) {
      return NextResponse.json({ error: 'กรุณาระบุวันที่' }, { status: 400 });
    }
    if (!data.grossWeight || data.grossWeight <= 0) {
      return NextResponse.json({ error: 'กรุณาระบุน้ำหนักรวมภาชนะ' }, { status: 400 });
    }

    const netWeight = data.netWeight || (data.grossWeight - (data.containerWeight || 0));

    let dryWeight = netWeight;
    if (data.rubberPercent) {
      dryWeight = calculateDryWeight(netWeight, data.rubberPercent);
    }

    const priceDateStr =
      typeof data.date === 'string'
        ? data.date.split('T')[0]
        : data.date instanceof Date
          ? data.date.toISOString().split('T')[0]
          : '';

    const [productPrice, member, productType, user] = await Promise.all([
      prisma.productPrice.findFirst({
        where: {
          date: {
            gte: new Date(`${priceDateStr}T00:00:00`),
            lte: new Date(`${priceDateStr}T23:59:59`),
          },
          productTypeId: data.productTypeId,
        },
      }),
      prisma.member.findUnique({ where: { id: data.memberId } }),
      prisma.productType.findUnique({ where: { id: data.productTypeId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const basePrice = data.pricePerUnit || productPrice?.price || 0;
    if (basePrice === 0) {
      return NextResponse.json({ error: 'กรุณาระบุราคาต่อหน่วย' }, { status: 400 });
    }

    const adjustedPrice = basePrice;
    const finalPrice = adjustedPrice + (data.bonusPrice || 0);
    const totalAmount = netWeight * finalPrice;

    if (!member) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสมาชิก' }, { status: 404 });
    }
    if (!productType) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทสินค้า' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 404 });
    }

    const { ownerAmount, tapperAmount } = calculateSplit(
      totalAmount,
      member.ownerPercent,
      member.tapperPercent
    );

    const purchaseDate = resolvePurchaseDate(data.date);

    const stockRelevantChanged =
      existing.productTypeId !== data.productTypeId ||
      Math.abs(existing.netWeight - netWeight) > EPS ||
      Math.abs(existing.finalPrice - finalPrice) > EPS;

    const updated = await prisma.$transaction(async (tx) => {
      if (stockRelevantChanged) {
        await reversePurchaseFromStock(tx, {
          purchaseId: existing.id,
          productTypeId: existing.productTypeId,
          purchaseNo: existing.purchaseNo,
          netWeight: existing.netWeight,
          unitCostPerKg: existing.finalPrice,
          date: new Date(),
          notes: `ย้อนก่อนแก้ไขรับซื้อ ${existing.purchaseNo}`,
        });
      }

      const row = await tx.purchase.update({
        where: { id: params.id },
        data: {
          date: purchaseDate,
          memberId: data.memberId,
          productTypeId: data.productTypeId,
          userId,
          grossWeight: data.grossWeight,
          containerWeight: data.containerWeight || 0,
          netWeight,
          rubberPercent: data.rubberPercent ?? null,
          dryWeight,
          basePrice,
          adjustedPrice,
          bonusPrice: data.bonusPrice || 0,
          finalPrice,
          totalAmount,
          ownerAmount,
          tapperAmount,
          notes: data.notes ?? null,
          ...(typeof data.isPaid === 'boolean' ? { isPaid: data.isPaid } : {}),
        },
        include: {
          member: true,
          productType: true,
          user: true,
        },
      });

      if (stockRelevantChanged) {
        await applyPurchaseToStock(tx, {
          productTypeId: row.productTypeId,
          qtyKg: row.netWeight,
          unitCostPerKg: row.finalPrice,
          refNo: row.purchaseNo,
          date: row.date,
          notes: row.notes,
          refId: row.id,
        });
      }

      return row;
    });

    cache.delete(CACHE_KEYS.DASHBOARD);
    logger.info('PUT /api/purchases/[id] - Success', { id: params.id });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof StockInsufficientError) {
      return NextResponse.json(
        {
          error: 'สต็อกคงเหลือไม่พอให้ย้อนรับซื้อเดิม (อาจมีการขายหรือปรับยอดแล้ว)',
          details: {
            productTypeId: error.productTypeId,
            availableKg: error.availableKg,
            requestedKg: error.requestedKg,
          },
        },
        { status: 400 }
      );
    }
    logger.error('PUT /api/purchases/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขการรับซื้อ' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchases/[id] - ลบรับซื้อ + คืนสต็อก
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการรับซื้อ' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await reversePurchaseFromStock(tx, {
        purchaseId: purchase.id,
        productTypeId: purchase.productTypeId,
        purchaseNo: purchase.purchaseNo,
        netWeight: purchase.netWeight,
        unitCostPerKg: purchase.finalPrice,
        date: new Date(),
        notes: `คืนสต็อกจากการลบรับซื้อ ${purchase.purchaseNo}`,
      });
      await tx.purchase.delete({
        where: { id: params.id },
      });
    });

    cache.delete(CACHE_KEYS.DASHBOARD);

    logger.info('DELETE /api/purchases/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบการรับซื้อเรียบร้อยแล้ว' });
  } catch (error) {
    if (error instanceof StockInsufficientError) {
      return NextResponse.json(
        {
          error: 'สต็อกคงเหลือไม่พอให้ลบรายการนี้ (น้ำหนักถูกขายหรือตัดไปแล้ว)',
          details: {
            productTypeId: error.productTypeId,
            availableKg: error.availableKg,
            requestedKg: error.requestedKg,
          },
        },
        { status: 400 }
      );
    }
    logger.error('DELETE /api/purchases/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบการรับซื้อ' },
      { status: 500 }
    );
  }
}
