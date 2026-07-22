import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseMaxNum(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * GET /api/destination-companies/next-code
 * Generates next code in format C### (e.g. C001, C002).
 */
export async function GET() {
  try {
    let maxNumber = 0;

    try {
      const result = await prisma.$queryRaw<Array<{ max_num: number | bigint | null }>>`
        SELECT MAX(CAST(SUBSTR(code, 2) AS INTEGER)) as max_num
        FROM "DestinationCompany"
        WHERE code LIKE 'C%'
          AND LENGTH(code) >= 2
          AND SUBSTR(code, 2) GLOB '[0-9]*'
      `;

      const maxNum = parseMaxNum(result[0]?.max_num);
      if (maxNum !== null) {
        maxNumber = maxNum;
      } else {
        const companies = await prisma.destinationCompany.findMany({
          select: { code: true },
          where: { code: { startsWith: 'C' } },
        });
        const existingNumbers = companies
          .map((c) => c.code)
          .filter((code) => /^C\d+$/.test(code))
          .map((code) => parseInt(code.substring(1), 10))
          .filter((num) => !Number.isNaN(num));
        maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      }
    } catch (queryError) {
      logger.warn('Raw query failed for destination company next-code', { error: queryError });
      const companies = await prisma.destinationCompany.findMany({
        select: { code: true },
        where: { code: { startsWith: 'C' } },
      });
      const existingNumbers = companies
        .map((c) => c.code)
        .filter((code) => /^C\d+$/.test(code))
        .map((code) => parseInt(code.substring(1), 10))
        .filter((num) => !Number.isNaN(num));
      maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    }

    let nextNumber = maxNumber + 1;
    let nextCode = `C${String(nextNumber).padStart(3, '0')}`;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const existing = await prisma.destinationCompany.findUnique({
        where: { code: nextCode },
        select: { id: true },
      });

      if (!existing) {
        const response = NextResponse.json({ code: nextCode });
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      }

      nextNumber++;
      nextCode = `C${String(nextNumber).padStart(3, '0')}`;
      attempts++;
    }

    const errorResponse = NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสบริษัทใหม่ได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 },
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return errorResponse;
  } catch (error) {
    logger.error('Failed to generate next destination company code', error);
    const errorResponse = NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสบริษัทใหม่ได้' },
      { status: 500 },
    );
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return errorResponse;
  }
}
