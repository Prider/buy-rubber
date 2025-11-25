import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

// GET /api/members - ดึงรายการสมาชิกทั้งหมด (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    logger.info('GET /api/members', { search, active, page, limit });

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
        { address: { contains: search } },
        { tapperName: { contains: search } },
      ];
    }
    
    if (active !== null) {
      where.isActive = active === 'true';
    }

    // Get total count for pagination
    const total = await prisma.member.count({ where });

    // Get paginated members
    const members = await prisma.member.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
        { code: 'desc' },
      ],
    });

    // Return members with pagination info
    logger.info('GET /api/members - Success', { count: members.length, total, page });
    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + members.length < total,
      }
    });
  } catch (error) {
    logger.error('GET /api/members - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก' },
      { status: 500 }
    );
  }
}

// POST /api/members - สร้างสมาชิกใหม่
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    logger.info('POST /api/members - Request', { code: data.code, name: data.name });

    // ตรวจสอบรหัสซ้ำ
    const existing = await prisma.member.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      logger.warn('POST /api/members - Duplicate code', { code: data.code });
      return NextResponse.json(
        { error: 'รหัสสมาชิกนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    const member = await prisma.member.create({
      data: {
        code: data.code,
        name: data.name,
        idCard: data.idCard,
        phone: data.phone,
        address: data.address,
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        ownerPercent: data.ownerPercent || 100,
        tapperPercent: data.tapperPercent || 0,
        tapperId: data.tapperId,
        tapperName: data.tapperName,
      },
    });

    logger.info('POST /api/members - Success', { memberId: member.id, code: member.code });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    logger.error('POST /api/members - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างสมาชิก' },
      { status: 500 }
    );
  }
}

