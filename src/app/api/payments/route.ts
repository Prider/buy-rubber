import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDocumentNumber } from '@/lib/utils';

// GET /api/payments - ดึงรายการจ่ายเงิน
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: true,
        user: true,
        items: {
          include: {
            purchase: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจ่ายเงิน' },
      { status: 500 }
    );
  }
}

// POST /api/payments - บันทึกการจ่ายเงิน
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // คำนวณยอดเงินรวม
    const purchases = await prisma.purchase.findMany({
      where: {
        id: { in: data.purchaseIds },
        isPaid: false,
      },
    });

    if (purchases.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบรายการรับซื้อที่ยังไม่ได้จ่ายเงิน' },
        { status: 400 }
      );
    }

    const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const advanceDeduct = data.advanceDeduct || 0;
    const netAmount = totalAmount - advanceDeduct;

    // สร้างเลขที่จ่ายเงิน
    const paymentNo = await generateDocumentNumber('PAY', new Date(data.date));

    // บันทึกการจ่ายเงิน
    const payment = await prisma.$transaction(async (tx) => {
      // สร้างการจ่ายเงิน
      const payment = await tx.payment.create({
        data: {
          paymentNo,
          date: new Date(data.date),
          memberId: data.memberId,
          userId: data.userId,
          totalAmount,
          advanceDeduct,
          netAmount,
          notes: data.notes,
          items: {
            create: data.purchaseIds.map((purchaseId: string) => ({
              purchaseId,
            })),
          },
        },
        include: {
          member: true,
          user: true,
          items: {
            include: {
              purchase: true,
            },
          },
        },
      });

      // อัพเดทสถานะการจ่ายเงินของรายการรับซื้อ
      await tx.purchase.updateMany({
        where: {
          id: { in: data.purchaseIds },
        },
        data: {
          isPaid: true,
        },
      });

      // หักเงินล่วงหน้า
      if (advanceDeduct > 0) {
        await tx.member.update({
          where: { id: data.memberId },
          data: {
            advanceBalance: {
              decrement: advanceDeduct,
            },
          },
        });
      }

      return payment;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการจ่ายเงิน' },
      { status: 500 }
    );
  }
}

