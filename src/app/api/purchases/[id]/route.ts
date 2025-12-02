import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// DELETE /api/purchases/[id] - Delete a purchase
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการรับซื้อ' },
        { status: 404 }
      );
    }

    await prisma.purchase.delete({
      where: { id: params.id },
    });

    logger.info('DELETE /api/purchases/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบการรับซื้อเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/purchases/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบการรับซื้อ' },
      { status: 500 }
    );
  }
}

