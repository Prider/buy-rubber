import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { generateDocumentNumber, getUserFromToken } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const companyName = searchParams.get('companyName');
    const productTypeId = searchParams.get('productTypeId');
    const sellingType = searchParams.get('sellingType');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date = { ...(where.date as Record<string, unknown> || {}), gte: start };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...(where.date as Record<string, unknown> || {}), lte: end };
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

    const sales = await (prisma as any).sale.findMany({
      where,
      include: {
        productType: true,
        // Avoid returning sensitive user fields (e.g. password hash)
        user: { select: { id: true, username: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(sales);
  } catch (error) {
    logger.error('GET /api/sales failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการขาย' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const sale = await (prisma as any).sale.create({
      data: {
        saleNo,
        date: saleDate,
        userId,
        companyName: String(data.companyName).trim(),
        productTypeId: data.productTypeId,
        weight,
        rubberPercent: data.rubberPercent !== '' && data.rubberPercent !== null && data.rubberPercent !== undefined
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
        user: true,
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    logger.error('POST /api/sales failed', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกการขาย' }, { status: 500 });
  }
}

