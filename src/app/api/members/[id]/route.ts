import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/members/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: params.id },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสมาชิก' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก' },
      { status: 500 }
    );
  }
}

// PUT /api/members/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const member = await prisma.member.update({
      where: { id: params.id },
      data: {
        name: data.name,
        idCard: data.idCard,
        phone: data.phone,
        address: data.address,
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        ownerPercent: data.ownerPercent,
        tapperPercent: data.tapperPercent,
        tapperId: data.tapperId,
        tapperName: data.tapperName,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสมาชิก' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.member.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'ลบสมาชิกเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบสมาชิก' },
      { status: 500 }
    );
  }
}

