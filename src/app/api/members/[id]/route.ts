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
    // Check if member has any purchases
    const purchaseCount = await prisma.purchase.count({
      where: { memberId: params.id },
    });

    if (purchaseCount > 0) {
      // Soft delete - mark as inactive instead of deleting
      // This preserves historical data and relationships
      await prisma.member.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      return NextResponse.json({ 
        message: 'ปิดการใช้งานสมาชิกเรียบร้อยแล้ว',
        note: `สมาชิกนี้มีประวัติการรับซื้อ ${purchaseCount} รายการ จึงไม่สามารถลบออกจากระบบได้ แต่จะถูกปิดการใช้งานแทน`,
        softDelete: true
      });
    }

    // If no purchases, still use soft delete for safety
    // You can change this to actual delete if needed
    await prisma.member.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: 'ปิดการใช้งานสมาชิกเรียบร้อยแล้ว',
      softDelete: true
    });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบสมาชิก' },
      { status: 500 }
    );
  }
}

