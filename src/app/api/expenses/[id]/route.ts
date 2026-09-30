import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { requireTenantAuth } from '@/platform/tenant';
import { cache, CACHE_KEYS, tenantKey } from '@/shared/cache';

const EDIT_ROLES = new Set(['admin', 'root', 'user']);

function parseExpenseDate(dateString: string): Date {
  const hasTimezone = dateString.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(dateString);
  const date = hasTimezone ? new Date(dateString) : new Date(`${dateString}+07:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  return date;
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth.auth;

    const existing = await prisma.expense.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลค่าใช้จ่าย' },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'ลบค่าใช้จ่ายเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบค่าใช้จ่าย' },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    const { tenantId, role } = auth.auth;

    if (!EDIT_ROLES.has(role)) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์แก้ไขค่าใช้จ่าย' },
        { status: 403 }
      );
    }

    const existing = await prisma.expense.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลค่าใช้จ่าย' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const category = typeof data.category === 'string' ? data.category.trim() : '';
    const parsedAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;

    if (!category) {
      return NextResponse.json({ error: 'กรุณาระบุประเภทค่าใช้จ่าย' }, { status: 400 });
    }
    if (typeof parsedAmount !== 'number' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินต้องมากกว่า 0' }, { status: 400 });
    }

    let date = existing.date;
    if (data.date) {
      try {
        date = parseExpenseDate(String(data.date));
      } catch {
        return NextResponse.json({ error: 'วันที่ไม่ถูกต้อง' }, { status: 400 });
      }
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        date,
        category,
        amount: Math.abs(parsedAmount),
        description: typeof data.description === 'string' && data.description.trim()
          ? data.description.trim()
          : null,
      },
    });

    cache.delete(tenantKey(tenantId, CACHE_KEYS.DASHBOARD));

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขค่าใช้จ่าย' },
      { status: 500 }
    );
  }
}


