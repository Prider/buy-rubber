import { NextRequest, NextResponse } from 'next/server';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getThaiPhoneError, THAI_PHONE_ERROR } from '@/lib/memberUtils';
import { normalizeSlipFontSize, type SlipFontSizeId } from '@/lib/slipFont';
import { normalizeSlipLogo, resolveSlipLogo } from '@/lib/slipLogo';
import { normalizeSlipPaperSize, type SlipPaperSizeId } from '@/lib/slipPaper';
import {
  paperSizeForTemplate,
  resolveStoredSlipTemplate,
  type SlipTemplateId,
} from '@/lib/slipTemplate';

const DEFAULT_COMPANY_NAME = 'บริษัทของฉัน';
const DEFAULT_COMPANY_ADDRESS = 'xxxxx';
const DEFAULT_FOOTER_TEXT =
  'กรุณาตรวจสอบนับเงินให้ตรงกับใบเสร็จรับเงินทุกครั้งก่อนมิฉะนั้นจะไม่รับผิดชอบใดๆทั้งสิ้นขอบคุณที่ใช้บริการค่ะ';

const KEY_COMPANY_NAME = 'slip_companyName';
const KEY_COMPANY_ADDRESS = 'slip_companyAddress';
const KEY_COMPANY_PHONE = 'slip_companyPhone';
const KEY_LOGO = 'slip_logo';
const KEY_TAX_ID = 'slip_taxId';
const KEY_PAPER_SIZE = 'slip_paperSize';
const KEY_FOOTER_TEXT = 'slip_footerText';
const KEY_FONT_SIZE = 'slip_fontSize';
const KEY_TEMPLATE = 'slip_template';

const SLIP_LOGO_REJECTED = 'ไฟล์โลโก้ไม่ถูกต้อง';

const TEMPLATE_KEYS = [
  KEY_COMPANY_NAME,
  KEY_COMPANY_ADDRESS,
  KEY_COMPANY_PHONE,
  KEY_LOGO,
  KEY_TAX_ID,
  KEY_PAPER_SIZE,
  KEY_FOOTER_TEXT,
  KEY_FONT_SIZE,
  KEY_TEMPLATE,
];

class SlipSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlipSettingsError';
  }
}

function getString(val: unknown): string | null {
  if (typeof val === 'string') return val;
  return null;
}

function storedOrDefault(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function storedTrimmed(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function digitsOnlyPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

/** Optional text: a provided string is saved as-is (including blank); otherwise keep the stored value. */
async function resolveOptionalText(incoming: unknown, key: string): Promise<string> {
  if (typeof incoming === 'string') return incoming.trim();
  const existing = await prisma.setting.findUnique({ where: { key } });
  return storedTrimmed(existing?.value);
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
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: TEMPLATE_KEYS,
        },
      },
    });

    const map = new Map(settings.map(s => [s.key, s.value]));
    const storedPaper: SlipPaperSizeId = normalizeSlipPaperSize(map.get(KEY_PAPER_SIZE));
    const template: SlipTemplateId = resolveStoredSlipTemplate(map.get(KEY_TEMPLATE), storedPaper);
    const paperSize = paperSizeForTemplate(template, storedPaper);
    const fontSize: SlipFontSizeId = normalizeSlipFontSize(map.get(KEY_FONT_SIZE));
    return NextResponse.json({
      companyName: storedOrDefault(map.get(KEY_COMPANY_NAME), DEFAULT_COMPANY_NAME),
      companyAddress: storedOrDefault(map.get(KEY_COMPANY_ADDRESS), DEFAULT_COMPANY_ADDRESS),
      companyPhone: digitsOnlyPhone(storedTrimmed(map.get(KEY_COMPANY_PHONE))),
      logo: resolveSlipLogo(map.has(KEY_LOGO) ? map.get(KEY_LOGO) : null),
      taxId: storedTrimmed(map.get(KEY_TAX_ID)),
      template,
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
  const licenseDenied = await rejectIfUnlicensed();
  if (licenseDenied) return licenseDenied;

  try {
    const data = await request.json();
    const companyName = getString(data?.companyName)?.trim() || DEFAULT_COMPANY_NAME;
    const companyAddress = getString(data?.companyAddress)?.trim() || DEFAULT_COMPANY_ADDRESS;

    let companyPhone: string;
    if (typeof data?.companyPhone === 'string') {
      companyPhone = digitsOnlyPhone(data.companyPhone);
      if (getThaiPhoneError(companyPhone)) {
        throw new SlipSettingsError(THAI_PHONE_ERROR);
      }
    } else {
      const existingPhone = await prisma.setting.findUnique({ where: { key: KEY_COMPANY_PHONE } });
      companyPhone = digitsOnlyPhone(storedTrimmed(existingPhone?.value));
    }

    let logo: string;
    if (typeof data?.logo === 'string') {
      const normalizedLogo = normalizeSlipLogo(data.logo);
      if (normalizedLogo === null) {
        throw new SlipSettingsError(SLIP_LOGO_REJECTED);
      }
      logo = normalizedLogo;
    } else {
      const existingLogo = await prisma.setting.findUnique({ where: { key: KEY_LOGO } });
      logo = existingLogo ? resolveSlipLogo(existingLogo.value) : resolveSlipLogo(null);
    }

    const taxId = await resolveOptionalText(data?.taxId, KEY_TAX_ID);

    let paperSize: SlipPaperSizeId;
    if (typeof data?.paperSize === 'string') {
      paperSize = normalizeSlipPaperSize(data.paperSize);
    } else {
      const existing = await prisma.setting.findUnique({ where: { key: KEY_PAPER_SIZE } });
      paperSize = normalizeSlipPaperSize(existing?.value);
    }

    let template: SlipTemplateId;
    if (typeof data?.template === 'string') {
      template = resolveStoredSlipTemplate(data.template, paperSize);
    } else {
      const existingTemplate = await prisma.setting.findUnique({ where: { key: KEY_TEMPLATE } });
      template = resolveStoredSlipTemplate(existingTemplate?.value, paperSize);
    }
    paperSize = paperSizeForTemplate(template, paperSize);

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
        where: { key: KEY_COMPANY_PHONE },
        update: { value: companyPhone },
        create: { key: KEY_COMPANY_PHONE, value: companyPhone },
      }),
      prisma.setting.upsert({
        where: { key: KEY_LOGO },
        update: { value: logo },
        create: { key: KEY_LOGO, value: logo },
      }),
      prisma.setting.upsert({
        where: { key: KEY_TAX_ID },
        update: { value: taxId },
        create: { key: KEY_TAX_ID, value: taxId },
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
      prisma.setting.upsert({
        where: { key: KEY_TEMPLATE },
        update: { value: template },
        create: { key: KEY_TEMPLATE, value: template },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าสลิปเรียบร้อยแล้ว',
      companyName,
      companyAddress,
      companyPhone,
      logo,
      taxId,
      template,
      paperSize,
      footerText,
      fontSize,
    });
  } catch (error: unknown) {
    if (error instanceof SlipSettingsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error('Failed to save slip settings', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' },
      { status: 500 }
    );
  }
}

