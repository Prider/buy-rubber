import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import { diffFields } from '@/lib/activityLogShared';
import { parseExpenseDate, validateExpenseData } from '@/lib/expenseInput';

type ExpenseSnapshot = {
  id: string;
  expenseNo: string;
  category: string;
  amount: number;
  description: string | null;
};

// PUT /api/expenses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบค่าใช้จ่าย' }, { status: 404 });
    }

    const data = await request.json();

    let validatedData;
    try {
      validatedData = validateExpenseData(data);
    } catch {
      return NextResponse.json(
        { error: 'กรุณาเลือกประเภทและกรอกจำนวนเงินที่มากกว่า 0' },
        { status: 400 }
      );
    }

    let parsedDate;
    try {
      if (!data.date) {
        throw new Error('Date is required');
      }
      parsedDate = parseExpenseDate(data.date);
    } catch {
      return NextResponse.json({ error: 'วันที่ไม่ถูกต้อง' }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        date: parsedDate.date,
        category: validatedData.category,
        amount: validatedData.amount,
        description: validatedData.description,
      },
    });

    cache.delete(CACHE_KEYS.DASHBOARD);

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'update',
      entityType: 'expense',
      entityId: updated.id,
      entityLabel: existing.expenseNo,
      summary: `แก้ค่าใช้จ่าย ${existing.expenseNo}`,
      changes: diffFields(
        {
          date: existing.date,
          category: existing.category,
          amount: existing.amount,
          description: existing.description,
        },
        {
          date: updated.date,
          category: updated.category,
          amount: updated.amount,
          description: updated.description,
        },
        ['date', 'category', 'amount', 'description'],
      ),
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Update expense error', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขค่าใช้จ่าย' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseModel = prisma.expense as typeof prisma.expense & {
      findUnique?: (args: { where: { id: string } }) => Promise<ExpenseSnapshot | null>;
    };

    const existing =
      typeof expenseModel.findUnique === 'function'
        ? await expenseModel.findUnique({ where: { id: params.id } })
        : null;

    await prisma.expense.delete({
      where: { id: params.id },
    });

    if (existing) {
      await recordActivity(prisma, {
        actor: getActivityActor(request),
        action: 'delete',
        entityType: 'expense',
        entityId: existing.id,
        entityLabel: existing.expenseNo,
        summary: `ลบค่าใช้จ่าย ${existing.expenseNo}`,
        changes: {
          expenseNo: existing.expenseNo,
          category: existing.category,
          amount: existing.amount,
          description: existing.description,
          soft: false,
        },
      });
    }

    return NextResponse.json({ message: 'ลบค่าใช้จ่ายเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบค่าใช้จ่าย' },
      { status: 500 }
    );
  }
}


