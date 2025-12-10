import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_KEYS, CACHE_TTL, generateCacheKey } from '@/lib/cache';

// Force Node.js runtime for Prisma support
export const runtime = 'nodejs';

const DEFAULT_LIMIT = 25; // lower default to reduce initial payloads
const MAX_LIMIT = 100;

// GET /api/members - ดึงรายการสมาชิกทั้งหมด (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    
    // Pagination parameters
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = Number.isNaN(limitParam) || limitParam < 1
      ? DEFAULT_LIMIT
      : Math.min(limitParam, MAX_LIMIT);
    const skip = (page - 1) * limit;

    logger.info('GET /api/members', { search, active, page, limit });
    
    // Generate cache key based on request parameters
    // Only cache if no search query (search results shouldn't be cached)
    const cacheKey = search 
      ? null 
      : generateCacheKey('members', { active, page: page.toString(), limit: limit.toString() });
    
    // Check cache first (only for non-search queries)
    if (cacheKey) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        logger.info('GET /api/members - Cache hit', { cacheKey });
        return NextResponse.json(cachedData);
      }
      logger.info('GET /api/members - Cache miss, fetching from database', { cacheKey });
    }

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
    const responseData = {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + members.length < total,
      }
    };
    
    // Cache the response (only for non-search queries)
    if (cacheKey) {
      cache.set(cacheKey, responseData, CACHE_TTL.MEMBERS);
    }
    
    logger.info('GET /api/members - Success', { count: members.length, total, page });
    return NextResponse.json(responseData);
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
    const existingCode = await prisma.member.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      logger.warn('POST /api/members - Duplicate code', { code: data.code });
      return NextResponse.json(
        { error: 'รหัสสมาชิกนี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }

    // ตรวจสอบชื่อซ้ำ (case-insensitive)
    // Use raw query for case-insensitive comparison (SQLite doesn't support mode: 'insensitive')
    const existingName = await prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>`
      SELECT id, code, name 
      FROM "Member" 
      WHERE LOWER(name) = LOWER(${data.name})
      LIMIT 1
    `;

    if (existingName && existingName.length > 0) {
      const duplicate = existingName[0];
      logger.warn('POST /api/members - Duplicate name', { name: data.name, existingCode: duplicate.code });
      return NextResponse.json(
        { error: `ชื่อ "${data.name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicate.code})` },
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

    // Invalidate members cache when a new member is created
    cache.deletePattern('^members:');
    logger.info('POST /api/members - Cache invalidated');

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

