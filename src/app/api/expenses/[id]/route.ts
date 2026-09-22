import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/lib/tenant';

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


