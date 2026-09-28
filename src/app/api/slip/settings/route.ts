import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { normalizeSlipFontSize, type SlipFontSizeId } from '@/lib/slipFont';
import { normalizeSlipPaperSize, type SlipPaperSizeId } from '@/lib/slipPaper';

const DEFAULT_COMPANY_NAME = 'สินทวี';
const DEFAULT_COMPANY_ADDRESS = '171/5 ม.8 ต.ชะมาย อ.ทุ่งสง จ.นครศรีฯ';
const DEFAULT_FOOTER_TEXT =
  'กรุณาตรวจสอบนับเงินให้ตรงกับใบเสร็จรับเงินทุกครั้งก่อนมิฉะนั้นจะไม่รับผิดชอบใดๆทั้งสิ้นขอบคุณที่ใช้บริการค่ะ';

const KEY_COMPANY_NAME = 'slip_companyName';
const KEY_COMPANY_ADDRESS = 'slip_companyAddress';
const KEY_PAPER_SIZE = 'slip_paperSize';
const KEY_FOOTER_TEXT = 'slip_footerText';
const KEY_FONT_SIZE = 'slip_fontSize';

const TEMPLATE_KEYS = [
  KEY_COMPANY_NAME,
  KEY_COMPANY_ADDRESS,
  KEY_PAPER_SIZE,
  KEY_FOOTER_TEXT,
  KEY_FONT_SIZE,
];

function getString(val: unknown): string | null {
  if (typeof val === 'string') return val;
  return null;
}

function storedOrDefault(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

/** Use the request value when present; otherwise keep the stored setting. */
async function resolveTemplateText(
  incoming: unknown,
  key: string,
  fallback: string,
): Promise<string> {
  if (typeof incoming === 'string') {
    return storedOrDefault(incoming, fallback);
  }
  const existing = await prisma.setting.findUnique({ where: { key } });
  return storedOrDefault(existing?.value, fallback);
}

// GET /api/slip/settings - ดึงการตั้งค่าการพิมพ์สลิป
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: TEMPLATE_KEYS,
        },
      },
    });

    const map = new Map(settings.map(s => [s.key, s.value]));
    const paperSize: SlipPaperSizeId = normalizeSlipPaperSize(map.get(KEY_PAPER_SIZE));
    const fontSize: SlipFontSizeId = normalizeSlipFontSize(map.get(KEY_FONT_SIZE));
    return NextResponse.json({
      companyName: storedOrDefault(map.get(KEY_COMPANY_NAME), DEFAULT_COMPANY_NAME),
      companyAddress: storedOrDefault(map.get(KEY_COMPANY_ADDRESS), DEFAULT_COMPANY_ADDRESS),
      paperSize,
      footerText: storedOrDefault(map.get(KEY_FOOTER_TEXT), DEFAULT_FOOTER_TEXT),
      fontSize,
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

    let paperSize: SlipPaperSizeId;
    if (typeof data?.paperSize === 'string') {
      paperSize = normalizeSlipPaperSize(data.paperSize);
    } else {
      const existing = await prisma.setting.findUnique({ where: { key: KEY_PAPER_SIZE } });
      paperSize = normalizeSlipPaperSize(existing?.value);
    }

    const footerText = await resolveTemplateText(data?.footerText, KEY_FOOTER_TEXT, DEFAULT_FOOTER_TEXT);

    let fontSize: SlipFontSizeId;
    if (typeof data?.fontSize === 'string' || typeof data?.fontSize === 'number') {
      fontSize = normalizeSlipFontSize(data.fontSize);
    } else {
      const existingFont = await prisma.setting.findUnique({ where: { key: KEY_FONT_SIZE } });
      fontSize = normalizeSlipFontSize(existingFont?.value);
    }

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
      prisma.setting.upsert({
        where: { key: KEY_PAPER_SIZE },
        update: { value: paperSize },
        create: { key: KEY_PAPER_SIZE, value: paperSize },
      }),
      prisma.setting.upsert({
        where: { key: KEY_FOOTER_TEXT },
        update: { value: footerText },
        create: { key: KEY_FOOTER_TEXT, value: footerText },
      }),
      prisma.setting.upsert({
        where: { key: KEY_FONT_SIZE },
        update: { value: fontSize },
        create: { key: KEY_FONT_SIZE, value: fontSize },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าสลิปเรียบร้อยแล้ว',
      companyName,
      companyAddress,
      paperSize,
      footerText,
      fontSize,
    });
  } catch (error: unknown) {
    logger.error('Failed to save slip settings', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' },
      { status: 500 }
    );
  }
}

