import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/members/[id]/servicefees - Get service fees for a member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const fetchAll = searchParams.get('fetchAll') === 'true';

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสมาชิก' }, { status: 404 });
    }

    // Build optional date fragments for the subquery
    const dateGte = startDate ? (() => { const d = new Date(startDate); d.setHours(0,0,0,0); return d; })() : null;
    const dateLte = endDate   ? (() => { const d = new Date(endDate);   d.setHours(23,59,59,999); return d; })() : null;

    const dateFilter = Prisma.sql`
      ${dateGte ? Prisma.sql`AND sf.date >= ${dateGte}` : Prisma.empty}
      ${dateLte ? Prisma.sql`AND sf.date <= ${dateLte}` : Prisma.empty}
    `;

    // Aggregate: total and per-category breakdown — single subquery instead of loading all rows
    type AggRow = { category: string; cnt: bigint; total: number };
    const aggRows = await prisma.$queryRaw<AggRow[]>`
      SELECT sf.category,
             COUNT(*)::bigint                        AS cnt,
             COALESCE(SUM(sf.amount), 0)::float      AS total
      FROM   "ServiceFee" sf
      WHERE  sf."purchaseNo" IN (
               SELECT DISTINCT "purchaseNo" FROM "Purchase" WHERE "memberId" = ${memberId}
             )
      ${dateFilter}
      GROUP BY sf.category
    `;

    const totalAmount = aggRows.reduce((s, r) => s + r.total, 0);
    const categorySummary = Object.fromEntries(
      aggRows.map((r) => [r.category, { count: Number(r.cnt), amount: r.total }])
    );
    const totalRecords = aggRows.reduce((s, r) => s + Number(r.cnt), 0);

    if (fetchAll) {
      const serviceFees = await prisma.$queryRaw<any[]>`
        SELECT sf.*
        FROM   "ServiceFee" sf
        WHERE  sf."purchaseNo" IN (
                 SELECT DISTINCT "purchaseNo" FROM "Purchase" WHERE "memberId" = ${memberId}
               )
        ${dateFilter}
        ORDER BY sf.date DESC
      `;

      return NextResponse.json({
        serviceFees,
        summary: { totalRecords, totalAmount, categorySummary },
      });
    }

    // Paginated path
    const skip = (page - 1) * limit;
    const serviceFees = await prisma.$queryRaw<any[]>`
      SELECT sf.*
      FROM   "ServiceFee" sf
      WHERE  sf."purchaseNo" IN (
               SELECT DISTINCT "purchaseNo" FROM "Purchase" WHERE "memberId" = ${memberId}
             )
      ${dateFilter}
      ORDER BY sf.date DESC
      LIMIT  ${limit} OFFSET ${skip}
    `;

    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      serviceFees,
      pagination: { page, limit, totalPages, totalRecords },
      summary: { totalRecords, totalAmount, categorySummary },
    });
  } catch (error) {
    logger.error('Failed to get member service fees', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าบริการ' },
      { status: 500 }
    );
  }
}
