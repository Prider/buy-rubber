import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { generateDocumentNumber, getUserFromToken } from '@/lib/utils';
import { applySaleToStock, StockInsufficientError } from '@/lib/stock/stockService';

export const runtime = 'nodejs';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type SaleRecord = {
  id: string;
  saleNo: string;
  date: Date;
  userId: string;
  companyName: string;
  productTypeId: string;
  weight: number;
  rubberPercent: number | null;
  pricePerUnit: number;
  expenseType: string | null;
  expenseCost: number | null;
  sellingType: string;
  totalAmount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  productType?: { id: string; code: string; name: string };
  user?: { id: string; username: string };
};

type SaleDelegate = {
  findMany(args?: unknown): Promise<SaleRecord[]>;
  count(args?: unknown): Promise<number>;
  create(args?: unknown): Promise<SaleRecord>;
};

const asSale = prisma as unknown as { sale?: SaleDelegate };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const companyName = searchParams.get('companyName');
    const productTypeId = searchParams.get('productTypeId');
    const sellingType = searchParams.get('sellingType');
    const search = searchParams.get('search');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const where: Record<string, unknown> = {};
    const dateFilter: { gte?: Date; lte?: Date } = {};
    const paginated = pageParam != null && pageParam !== '';
    const page = paginated ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
    const limit = paginated
      ? Math.min(MAX_LIMIT, Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))
      : undefined;

    if (startDate) {
      const start = new Date(startDate);
      if (!Number.isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }
    if (dateFilter.gte || dateFilter.lte) {
      where.date = dateFilter;
    }
    if (companyName) where.companyName = { contains: companyName };
    if (productTypeId) where.productTypeId = productTypeId;
    if (sellingType) where.sellingType = sellingType;

    if (search) {
      const s = String(search).trim();
      if (s) {
        where.OR = [
          { saleNo: { contains: s } },
          { companyName: { contains: s } },
          { sellingType: { contains: s } },
          { productType: { is: { name: { contains: s } } } },
          { productType: { is: { code: { contains: s } } } },
        ];
      }
    }

    const saleSelect = {
      id: true,
      saleNo: true,
      date: true,
      userId: true,
      companyName: true,
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
      // Avoid returning sensitive user fields (e.g. password hash)
      user: { select: { id: true, username: true } },
    };

    const orderBy = [{ date: 'desc' }, { createdAt: 'desc' }];

    if (!asSale.sale) {
      return NextResponse.json(
        paginated
          ? {
              data: [],
              pagination: {
                page,
                limit: limit ?? DEFAULT_LIMIT,
                total: 0,
                totalPages: 1,
              },
            }
          : [],
      );
    }

    if (paginated && limit !== undefined) {
      const [sales, total] = await Promise.all([
        asSale.sale.findMany({
          where,
          select: saleSelect,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        asSale.sale.count({ where }),
      ]);

      return NextResponse.json({
        data: sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    const sales = await asSale.sale.findMany({
      where,
      select: saleSelect,
      orderBy,
    });

    return NextResponse.json(sales);
  } catch (error) {
    logger.error('GET /api/sales failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการขาย' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!asSale.sale) {
      return NextResponse.json({ error: 'ระบบยังไม่รองรับการขายในสภาพแวดล้อมนี้' }, { status: 501 });
    }

    const data = await request.json();
    const tokenUser = getUserFromToken(request);
    const userId = data.userId || tokenUser?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 401 });
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

    const [user, productType] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.productType.findUnique({ where: { id: data.productTypeId } }),
    ]);

    if (!user) return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 404 });
    if (!productType) return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทสินค้า' }, { status: 404 });

    const saleDate = data.date ? new Date(data.date) : new Date();
    const saleNo = await generateDocumentNumber('SAL', saleDate);
    const weight = Number(data.weight);
    const pricePerUnit = Number(data.pricePerUnit);
    const expenseCost = data.expenseCost === undefined || data.expenseCost === null || data.expenseCost === ''
      ? null
      : Number(data.expenseCost);
    if (expenseCost !== null && (Number.isNaN(expenseCost) || expenseCost < 0)) {
      return NextResponse.json({ error: 'ค่าใช้จ่ายไม่ถูกต้อง' }, { status: 400 });
    }

    // totalAmount is net amount after expenses (if provided)
    const totalAmount = weight * pricePerUnit - (expenseCost || 0);

    const sale = await prisma.$transaction(async (tx) => {
      // Deduct stock first; if insufficient, throw to abort sale creation.
      await applySaleToStock(tx, {
        productTypeId: data.productTypeId,
        qtyKg: weight,
        refNo: saleNo,
        date: saleDate,
        notes: data.notes ? String(data.notes) : null,
      });

      const txSale = (tx as unknown as { sale?: SaleDelegate }).sale;
      if (!txSale) {
        throw new Error('Sale delegate is not available in transaction client');
      }

      return txSale.create({
        data: {
          saleNo,
          date: saleDate,
          userId,
          companyName: String(data.companyName).trim(),
          productTypeId: data.productTypeId,
          weight,
          rubberPercent:
            data.rubberPercent !== '' && data.rubberPercent !== null && data.rubberPercent !== undefined
              ? Number(data.rubberPercent)
              : null,
          pricePerUnit,
          expenseType: data.expenseType ? String(data.expenseType) : null,
          expenseCost: expenseCost,
          sellingType: String(data.sellingType),
          totalAmount,
          notes: data.notes ? String(data.notes) : null,
        },
        include: {
          productType: true,
          // Avoid exposing sensitive user fields like password hashes
          user: { select: { id: true, username: true } },
        },
      });
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    if (error instanceof StockInsufficientError) {
      return NextResponse.json(
        {
          error: 'สต็อกไม่พอสำหรับการขายรายการนี้',
          details: {
            productTypeId: error.productTypeId,
            availableKg: error.availableKg,
            requestedKg: error.requestedKg,
          },
        },
        { status: 400 },
      );
    }

    logger.error('POST /api/sales failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกการขาย' }, { status: 500 });
  }
}

