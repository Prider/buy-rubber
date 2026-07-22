import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reverseSaleFromStock } from '@/lib/stock/stockService';
import { parseSaleExpensesFromBody } from '@/lib/saleExpenses';

export const runtime = 'nodejs';

type SaleRecord = {
  id: string;
  saleNo: string;
  date: Date;
  productTypeId: string;
  weight: number;
};

type SaleDelegate = {
  findUnique(args: unknown): Promise<SaleRecord | null>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

const asSale = prisma as unknown as { sale?: SaleDelegate };

const saleDetailSelect = {
  id: true,
  saleNo: true,
  date: true,
  userId: true,
  companyName: true,
  destinationCompanyId: true,
  productTypeId: true,
  weight: true,
  rubberPercent: true,
  pricePerUnit: true,
  expenseType: true,
  expenseCost: true,
  sellingType: true,
  totalAmount: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  productType: { select: { id: true, code: true, name: true } },
  expenses: {
    select: { id: true, type: true, amount: true, note: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!asSale.sale) {
      return NextResponse.json({ error: 'ระบบยังไม่รองรับการจัดการการขายในสภาพแวดล้อมนี้' }, { status: 501 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      select: saleDetailSelect,
    });

    if (!sale) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการขาย' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    logger.error('GET /api/sales/[id] failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการขาย' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    if (!asSale.sale) {
      return NextResponse.json({ error: 'ระบบยังไม่รองรับการจัดการการขายในสภาพแวดล้อมนี้' }, { status: 501 });
    }
    const sale = await asSale.sale.findUnique({
      where: { id: params.id },
      select: { id: true, saleNo: true, date: true, productTypeId: true, weight: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการขาย' }, { status: 404 });
    }

    if (!data.destinationCompanyId || !String(data.destinationCompanyId).trim()) {
      return NextResponse.json({ error: 'กรุณาเลือกบริษัทปลายทาง' }, { status: 400 });
    }
    if (!data.productTypeId) {
      return NextResponse.json({ error: 'กรุณาเลือกประเภทสินค้า' }, { status: 400 });
    }
    if (!data.weight || Number(data.weight) <= 0) {
      return NextResponse.json({ error: 'กรุณาระบุน้ำหนักที่ขาย' }, { status: 400 });
    }
    if (data.pricePerUnit === undefined || data.pricePerUnit === null || Number(data.pricePerUnit) < 0) {
      return NextResponse.json({ error: 'กรุณาระบุราคา' }, { status: 400 });
    }
    if (!data.sellingType) {
      return NextResponse.json({ error: 'กรุณาเลือกรูปแบบการขาย' }, { status: 400 });
    }

    const parsedExpenses = parseSaleExpensesFromBody(data);
    if (parsedExpenses.error) {
      return NextResponse.json({ error: parsedExpenses.error }, { status: 400 });
    }

    const [productType, destinationCompany] = await Promise.all([
      prisma.productType.findUnique({
        where: { id: data.productTypeId },
        select: { id: true },
      }),
      prisma.destinationCompany.findUnique({
        where: { id: String(data.destinationCompanyId) },
        select: { id: true, name: true },
      }),
    ]);
    if (!productType) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทสินค้า' }, { status: 404 });
    }
    if (!destinationCompany) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบริษัทปลายทาง' }, { status: 404 });
    }

    const weight = Number(data.weight);
    const pricePerUnit = Number(data.pricePerUnit);
    const { expenses, expenseCost, expenseType, notes } = parsedExpenses;
    const totalAmount = weight * pricePerUnit - (expenseCost || 0);

    const updated = await prisma.$transaction(async (tx) => {
      return tx.sale.update({
        where: { id: params.id },
        data: {
          date: data.date ? new Date(data.date) : sale.date,
          companyName: destinationCompany.name,
          destinationCompanyId: destinationCompany.id,
          productTypeId: data.productTypeId,
          weight,
          rubberPercent:
            data.rubberPercent !== '' && data.rubberPercent !== null && data.rubberPercent !== undefined
              ? Number(data.rubberPercent)
              : null,
          pricePerUnit,
          expenseType,
          expenseCost,
          sellingType: String(data.sellingType),
          totalAmount,
          notes,
          expenses: {
            deleteMany: {},
            create: expenses.map((e, index) => ({
              type: e.type,
              amount: e.amount,
              note: e.note,
              sortOrder: index,
            })),
          },
        },
        select: saleDetailSelect,
      });
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
    if (!asSale.sale) {
      return NextResponse.json({ error: 'ระบบยังไม่รองรับการจัดการการขายในสภาพแวดล้อมนี้' }, { status: 501 });
    }
    const sale = await asSale.sale.findUnique({
      where: { id: params.id },
      select: { id: true, saleNo: true, productTypeId: true, weight: true },
    });
    if (!sale) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการขาย' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const txSale = (tx as unknown as { sale?: SaleDelegate }).sale;
      if (!txSale) {
        throw new Error('Sale delegate is not available in transaction client');
      }
      await reverseSaleFromStock(tx, {
        productTypeId: sale.productTypeId,
        qtyKg: sale.weight,
        refNo: sale.saleNo,
        date: new Date(),
        notes: `คืนสต็อกจากการลบรายการขาย ${sale.saleNo}`,
      });
      // SaleExpense rows cascade on delete via schema
      await txSale.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ message: 'ลบรายการขายเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/sales/[id] failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบรายการขาย' }, { status: 500 });
  }
}
