import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { generateDocumentNumber, getUserFromToken } from '@/lib/utils';
import { resolveBusinessDate } from '@/lib/resolveBusinessDate';
import { applySaleToStock, StockInsufficientError } from '@/lib/stock/stockService';
import { parseSaleExpensesFromBody } from '@/lib/saleExpenses';

export const runtime = 'nodejs';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
/** Cap for unpaginated callers (e.g. date-range totals). */
const UNPAGINATED_MAX = 1000;

type SaleRecord = {
  id: string;
  saleNo: string;
  date: Date;
  userId: string;
  companyName: string;
  destinationCompanyId: string | null;
  productTypeId: string;
  weight: number;
  rubberPercent: number | null;
  pricePerUnit: number;
  expenseType: string | null;
  expenseCost: number | null;
  sellingType: string;
  totalAmount: number;
  unitCostPerKg: number | null;
  costOfGoods: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  productType?: { id: string; code: string; name: string };
  user?: { id: string; username: string };
  expenses?: Array<{ id: string; type: string; amount: number; note: string | null; sortOrder: number }>;
};

type SaleWithProfit = SaleRecord & {
  profitLoss: number | null;
};

type SaleDelegate = {
  findMany(args?: unknown): Promise<SaleRecord[]>;
  count(args?: unknown): Promise<number>;
  create(args?: unknown): Promise<SaleRecord>;
};

const asSale = prisma as unknown as { sale?: SaleDelegate };

/** List select — no nested expenses (use denormalized expenseType / GET by id for lines). */
const saleListSelect = {
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
  unitCostPerKg: true,
  costOfGoods: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  productType: { select: { id: true, code: true, name: true } },
};

/** Derive P/L from denormalized Sale COGS columns (no ledger join). */
function withSaleProfitLoss(sales: SaleRecord[]): SaleWithProfit[] {
  return sales.map((sale) => {
    const unitCostPerKg =
      sale.unitCostPerKg != null && Number.isFinite(Number(sale.unitCostPerKg))
        ? Number(sale.unitCostPerKg)
        : null;
    let costOfGoods =
      sale.costOfGoods != null && Number.isFinite(Number(sale.costOfGoods))
        ? Number(sale.costOfGoods)
        : null;
    if (costOfGoods == null && unitCostPerKg != null) {
      costOfGoods = sale.weight * unitCostPerKg;
    }
    return {
      ...sale,
      unitCostPerKg,
      costOfGoods,
      profitLoss: costOfGoods != null ? sale.totalAmount - costOfGoods : null,
    };
  });
}

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
      : UNPAGINATED_MAX;

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
        // Prefetch matching product types to avoid relation joins in the Sale query
        const matchingProductTypes = await prisma.productType.findMany({
          where: {
            OR: [{ name: { contains: s } }, { code: { contains: s } }],
          },
          select: { id: true },
          take: 50,
        });
        const productTypeIds = matchingProductTypes.map((pt) => pt.id);

        where.OR = [
          { saleNo: { contains: s } },
          { companyName: { contains: s } },
          { sellingType: { contains: s } },
          ...(productTypeIds.length > 0 ? [{ productTypeId: { in: productTypeIds } }] : []),
        ];
      }
    }

    const orderBy = [{ date: 'desc' }, { createdAt: 'desc' }];

    if (!asSale.sale) {
      return NextResponse.json(
        paginated
          ? {
              data: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 1,
              },
            }
          : [],
      );
    }

    if (paginated) {
      const [sales, total] = await Promise.all([
        asSale.sale.findMany({
          where,
          select: saleListSelect,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        asSale.sale.count({ where }),
      ]);

      const data = withSaleProfitLoss(sales);

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    // Unpaginated callers still get a hard cap to avoid loading the full table
    const sales = await asSale.sale.findMany({
      where,
      select: saleListSelect,
      orderBy,
      take: limit,
    });

    return NextResponse.json(withSaleProfitLoss(sales));
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

    const [user, productType, destinationCompany] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.productType.findUnique({ where: { id: data.productTypeId } }),
      prisma.destinationCompany.findUnique({ where: { id: String(data.destinationCompanyId) } }),
    ]);

    if (!user) {
      return NextResponse.json(
        {
          error: 'ไม่พบข้อมูลผู้ใช้',
          details: 'Session หมดอายุหรือฐานข้อมูลถูกสร้างใหม่ กรุณาออกจากระบบแล้วเข้าสู่ระบบอีกครั้ง',
        },
        { status: 404 },
      );
    }
    if (!productType) return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทสินค้า' }, { status: 404 });
    if (!destinationCompany || !destinationCompany.isActive) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลบริษัทปลายทาง หรือถูกปิดการใช้งาน' }, { status: 404 });
    }

    const saleDate = resolveBusinessDate(data.date);
    const saleNo = generateDocumentNumber('SAL', saleDate);
    const weight = Number(data.weight);
    const pricePerUnit = Number(data.pricePerUnit);
    const { expenses, expenseCost, expenseType, notes } = parsedExpenses;

    const totalAmount = weight * pricePerUnit - (expenseCost || 0);

    const sale = await prisma.$transaction(async (tx) => {
      const stockCost = await applySaleToStock(tx, {
        productTypeId: data.productTypeId,
        qtyKg: weight,
        refNo: saleNo,
        date: saleDate,
        notes,
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
          unitCostPerKg: stockCost?.unitCostPerKg ?? null,
          costOfGoods: stockCost?.costOfGoods ?? null,
          notes,
          expenses: {
            create: expenses.map((e, index) => ({
              type: e.type,
              amount: e.amount,
              note: e.note,
              sortOrder: index,
            })),
          },
        },
        include: {
          productType: { select: { id: true, code: true, name: true } },
          user: { select: { id: true, username: true } },
          expenses: {
            select: { id: true, type: true, amount: true, note: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
          },
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
