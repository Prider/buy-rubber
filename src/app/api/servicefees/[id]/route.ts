import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getActivityActor, recordActivity } from '@/lib/activityLog';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// DELETE /api/servicefees/[id] - Delete a service fee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceFee = await prisma.serviceFee.findUnique({
      where: { id: params.id },
    });

    if (!serviceFee) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลค่าบริการ' },
        { status: 404 }
      );
    }

    await prisma.serviceFee.delete({
      where: { id: params.id },
    });

    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'delete',
      entityType: 'serviceFee',
      entityId: serviceFee.id,
      entityLabel: serviceFee.serviceFeeNo,
      summary: `ลบค่าบริการ ${serviceFee.serviceFeeNo}`,
      changes: {
        serviceFeeNo: serviceFee.serviceFeeNo,
        purchaseNo: serviceFee.purchaseNo,
        category: serviceFee.category,
        amount: serviceFee.amount,
        soft: false,
      },
    });

    logger.info('DELETE /api/servicefees/[id] - Success', { id: params.id });
    return NextResponse.json({ message: 'ลบค่าบริการเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('DELETE /api/servicefees/[id] - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบค่าบริการ' },
      { status: 500 }
    );
  }
}

