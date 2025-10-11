import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDocumentNumber } from '@/lib/utils';

// GET /api/advances - ดึงรายการเบิกเงินล่วงหน้า
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (memberId) {
      where.memberId = memberId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const advances = await prisma.advance.findMany({
      where,
      include: {
        member: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(advances);
  } catch (error) {
    console.error('Get advances error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเงินล่วงหน้า' },
      { status: 500 }
    );
  }
}

// POST /api/advances - บันทึกการเบิกเงินล่วงหน้า
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // สร้างเลขที่เบิกเงิน
    const advanceNo = await generateDocumentNumber('ADV', new Date(data.date));

    // บันทึกการเบิกเงินล่วงหน้า
    const advance = await prisma.$transaction(async (tx) => {
      const advance = await tx.advance.create({
        data: {
          advanceNo,
          date: new Date(data.date),
          memberId: data.memberId,
          amount: data.amount,
          remaining: data.amount,
          notes: data.notes,
        },
        include: {
          member: true,
        },
      });

      // อัพเดทยอดเงินล่วงหน้าของสมาชิก
      await tx.member.update({
        where: { id: data.memberId },
        data: {
          advanceBalance: {
            increment: data.amount,
          },
        },
      });

      return advance;
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error('Create advance error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกเงินล่วงหน้า' },
      { status: 500 }
    );
  }
}

