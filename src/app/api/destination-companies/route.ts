import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cache, CACHE_TTL, generateCacheKey } from '@/lib/cache';

export const runtime = 'nodejs';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = Number.isNaN(limitParam) || limitParam < 1
      ? DEFAULT_LIMIT
      : Math.min(limitParam, MAX_LIMIT);
    const skip = (page - 1) * limit;

    logger.info('GET /api/destination-companies', { search, active, page, limit });

    const cacheKey = search
      ? null
      : generateCacheKey('destination-companies', {
          active,
          page: page.toString(),
          limit: limit.toString(),
        });

    if (cacheKey) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
        { address: { contains: search } },
      ];
    }

    if (active !== null) {
      where.isActive = active === 'true';
    }

    const total = await prisma.destinationCompany.count({ where });
    const companies = await prisma.destinationCompany.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { code: 'desc' }],
    });

    const responseData = {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / limit),
        hasMore: skip + companies.length < total,
      },
    };

    if (cacheKey) {
      cache.set(cacheKey, responseData, CACHE_TTL.DESTINATION_COMPANIES);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('GET /api/destination-companies - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบริษัทปลายทาง' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    logger.info('POST /api/destination-companies - Request', { code: data.code, name: data.name });

    if (!data.code || !String(data.code).trim()) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสบริษัท' }, { status: 400 });
    }
    if (!data.name || !String(data.name).trim()) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อบริษัท' }, { status: 400 });
    }

    const code = String(data.code).trim();
    const name = String(data.name).trim();

    const existingCode = await prisma.destinationCompany.findUnique({
      where: { code },
    });
    if (existingCode) {
      return NextResponse.json({ error: 'รหัสบริษัทนี้มีอยู่แล้ว' }, { status: 400 });
    }

    const existingName = await prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>`
      SELECT id, code, name
      FROM "DestinationCompany"
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (existingName && existingName.length > 0) {
      const duplicate = existingName[0];
      return NextResponse.json(
        { error: `ชื่อ "${name}" มีอยู่ในระบบแล้ว (รหัส: ${duplicate.code})` },
        { status: 400 },
      );
    }

    const company = await prisma.destinationCompany.create({
      data: {
        code,
        name,
        phone: data.phone ? String(data.phone).trim() : null,
        address: data.address ? String(data.address).trim() : null,
      },
    });

    cache.deletePattern('^destination-companies:');

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    logger.error('POST /api/destination-companies - Failed', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างบริษัทปลายทาง' },
      { status: 500 },
    );
  }
}
