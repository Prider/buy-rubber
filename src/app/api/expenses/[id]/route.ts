import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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


