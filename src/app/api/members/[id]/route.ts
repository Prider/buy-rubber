import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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

    // ตรวจสอบชื่อซ้ำ (case-insensitive) - แต่ไม่นับสมาชิกที่กำลังแก้ไข
    // Use raw query for case-insensitive comparison in PostgreSQL
    const existingName = await prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>`
      SELECT id, code, name 
      FROM "Member" 
      WHERE LOWER(name) = LOWER(${data.name})
        AND id != ${params.id}
      LIMIT 1
    `;

    if (existingName && existingName.length > 0) {
      const duplicate = existingName[0];
      logger.warn('PUT /api/members/[id] - Duplicate name', { name: data.name, existingCode: duplicate.code, updatingId: params.id });
      return NextResponse.json(
        { error: `ชื่อ "${data.name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicate.code})` },
        { status: 400 }
      );
    }

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
    // Check if member has any related records (purchases, payments, etc.)
    const [purchaseCount] = await Promise.all([
      prisma.purchase.count({
        where: { memberId: params.id },
      })
    ]);

    const totalRelatedRecords = purchaseCount;

    // If member has any related records, always do soft delete
    // This preserves historical data and prevents foreign key constraint violations
    if (totalRelatedRecords > 0) {
      logger.info('Soft deleting member with related records', {
        memberId: params.id,
        purchaseCount,
      });

      await prisma.member.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      const notes = [];
      if (purchaseCount > 0) {
        notes.push(`ประวัติการรับซื้อ ${purchaseCount} รายการ`);
      }

      return NextResponse.json({ 
        message: 'ปิดการใช้งานสมาชิกเรียบร้อยแล้ว',
        note: `สมาชิกนี้มี${notes.join(' และ ')} จึงไม่สามารถลบออกจากระบบได้ แต่จะถูกปิดการใช้งานแทน`,
        softDelete: true
      });
    }

    // Try hard delete only if no related records exist
    // Wrap in try-catch to handle any unexpected foreign key constraints
    try {
      await prisma.member.delete({
        where: { id: params.id },
      });

      logger.info('Hard deleted member', { memberId: params.id });
      return NextResponse.json({
        message: 'ลบสมาชิกเรียบร้อยแล้ว',
        softDelete: false,
      });
    } catch (deleteError: any) {
      // If delete fails due to foreign key constraint, fall back to soft delete
      if (deleteError?.code === 'P2003' || deleteError?.message?.includes('foreign key')) {
        logger.warn('Hard delete failed due to foreign key constraint, falling back to soft delete', {
          memberId: params.id,
          error: deleteError.message,
        });

        await prisma.member.update({
          where: { id: params.id },
          data: { isActive: false },
        });

        return NextResponse.json({ 
          message: 'ปิดการใช้งานสมาชิกเรียบร้อยแล้ว',
          note: 'ไม่สามารถลบสมาชิกออกจากระบบได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง แต่จะถูกปิดการใช้งานแทน',
          softDelete: true
        });
      }
      // Re-throw if it's a different error
      throw deleteError;
    }
  } catch (error: any) {
    logger.error('Delete member error', error, {
      memberId: params.id,
      errorCode: error?.code,
    });
    
    // Provide more specific error message
    const errorMessage = error?.code === 'P2003' || error?.message?.includes('foreign key')
      ? 'ไม่สามารถลบสมาชิกได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง กรุณาปิดการใช้งานแทน'
      : 'เกิดข้อผิดพลาดในการลบสมาชิก';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

