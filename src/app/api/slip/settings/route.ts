import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const DEFAULT_COMPANY_NAME = 'สินทวี';
const DEFAULT_COMPANY_ADDRESS = '171/5 ม.8 ต.ชะมาย อ.ทุ่งสง จ.นครศรีฯ';

const KEY_COMPANY_NAME = 'slip_companyName';
const KEY_COMPANY_ADDRESS = 'slip_companyAddress';

function getString(val: unknown): string | null {
  if (typeof val === 'string') return val;
  return null;
}

// GET /api/slip/settings - ดึงการตั้งค่าการพิมพ์สลิป
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [KEY_COMPANY_NAME, KEY_COMPANY_ADDRESS],
        },
      },
    });

    const map = new Map(settings.map(s => [s.key, s.value]));
    return NextResponse.json({
      companyName: map.get(KEY_COMPANY_NAME) || DEFAULT_COMPANY_NAME,
      companyAddress: map.get(KEY_COMPANY_ADDRESS) || DEFAULT_COMPANY_ADDRESS,
    });
  } catch (error: unknown) {
    logger.error('Failed to get slip settings', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงการตั้งค่า' },
      { status: 500 }
    );
  }
}

// POST /api/slip/settings - บันทึกการตั้งค่าการพิมพ์สลิป
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const companyName = getString(data?.companyName)?.trim() || DEFAULT_COMPANY_NAME;
    const companyAddress = getString(data?.companyAddress)?.trim() || DEFAULT_COMPANY_ADDRESS;

    await Promise.all([
      prisma.setting.upsert({
        where: { key: KEY_COMPANY_NAME },
        update: { value: companyName },
        create: { key: KEY_COMPANY_NAME, value: companyName },
      }),
      prisma.setting.upsert({
        where: { key: KEY_COMPANY_ADDRESS },
        update: { value: companyAddress },
        create: { key: KEY_COMPANY_ADDRESS, value: companyAddress },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าสลิปเรียบร้อยแล้ว',
      companyName,
      companyAddress,
    });
  } catch (error: unknown) {
    logger.error('Failed to save slip settings', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' },
      { status: 500 }
    );
  }
}

