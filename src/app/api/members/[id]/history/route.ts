import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface HistoryItem {
  id: string;
  kind: 'purchase';
  date: Date;
  createdAt: Date;
  purchaseNo: string | null;
  label: string;
  netWeight: number | null;
  unitPrice: number | null;
  moisturePercent: number | null;
  moistureUnit: string | null;
  amount: number;
  notes: string | null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateRange(startDate: string | null, endDate: string | null) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start && !end) return undefined;

  const range: { gte?: Date; lte?: Date } = {};
  if (start) range.gte = start;
  if (end) {
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return range;
}

function byNewest(left: HistoryItem, right: HistoryItem) {
  const dateDiff = right.date.getTime() - left.date.getTime();
  if (dateDiff !== 0) return dateDiff;
  return right.createdAt.getTime() - left.createdAt.getTime();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const memberId = params.id;
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสมาชิก' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const requestedLimit = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(50, Math.max(1, Number.isNaN(requestedLimit) ? 10 : requestedLimit));
    const range = dateRange(searchParams.get('startDate'), searchParams.get('endDate'));

    const purchases = await prisma.purchase.findMany({
      where: {
        memberId,
        ...(range ? { date: range } : {}),
      },
      select: {
        id: true,
        date: true,
        createdAt: true,
        purchaseNo: true,
        netWeight: true,
        basePrice: true,
        moisturePercent: true,
        moistureUnit: true,
        totalAmount: true,
        notes: true,
        productType: { select: { name: true } },
      },
    });

    const items: HistoryItem[] = purchases.map((purchase) => ({
      id: purchase.id,
      kind: 'purchase' as const,
      date: purchase.date,
      createdAt: purchase.createdAt,
      purchaseNo: purchase.purchaseNo,
      label: purchase.productType?.name || '-',
      netWeight: purchase.netWeight,
      unitPrice: purchase.basePrice,
      moisturePercent: purchase.moisturePercent,
      moistureUnit: purchase.moistureUnit,
      amount: purchase.totalAmount,
      notes: purchase.notes,
    }));

    items.sort(byNewest);

    const total = items.length;
    const start = (page - 1) * limit;
    const pageItems = items.slice(start, start + limit);
    const purchaseAmount = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const totalWeight = purchases.reduce((sum, purchase) => sum + purchase.netWeight, 0);

    return NextResponse.json({
      rows: pageItems.map((item) => ({
        ...item,
        date: item.date.toISOString(),
        createdAt: item.createdAt.toISOString(),
      })),
      summary: {
        purchaseCount: purchases.length,
        purchaseAmount,
        totalWeight,
        avgPrice: purchases.length > 0 && totalWeight > 0 ? purchaseAmount / totalWeight : 0,
        totalRecords: total,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: start + pageItems.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to get member history', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงประวัติสมาชิก' },
      { status: 500 },
    );
  }
}
