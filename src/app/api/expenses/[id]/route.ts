import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActivityActor, recordActivity } from '@/lib/activityLog';

type ExpenseSnapshot = {
  id: string;
  expenseNo: string;
  category: string;
  amount: number;
  description: string | null;
};

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


