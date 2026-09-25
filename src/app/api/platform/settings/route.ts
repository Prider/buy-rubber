import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { requirePlatformAuth } from '@/platform/tenant';
import { bytesToDataUrl, promptPayQrDataUrl } from '@/platform/promptPayQr';

export const runtime = 'nodejs';

async function getOrCreateSettings() {
  return prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAuth(request);
  if (!auth.ok) return auth.response;

  const settings = await getOrCreateSettings();
  const uploadedQr = bytesToDataUrl(settings.qrImage, settings.qrImageMimeType);
  const generatedQr = uploadedQr
    ? null
    : await promptPayQrDataUrl(settings.promptPayId, settings.premiumPriceThb);

  return NextResponse.json({
    bankName: settings.bankName,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
    promptPayId: settings.promptPayId,
    premiumPriceThb: settings.premiumPriceThb,
    qrDataUrl: uploadedQr || generatedQr,
    hasUploadedQr: Boolean(uploadedQr),
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformAuth(request);
  if (!auth.ok) return auth.response;

  const contentType = request.headers.get('content-type') || '';
  let bankName = '';
  let accountName = '';
  let accountNumber = '';
  let promptPayId = '';
  let premiumPriceThb = 0;
  let qrImage: Buffer | undefined;
  let qrImageMimeType: string | undefined;
  let clearQr = false;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    bankName = String(form.get('bankName') || '');
    accountName = String(form.get('accountName') || '');
    accountNumber = String(form.get('accountNumber') || '');
    promptPayId = String(form.get('promptPayId') || '');
    premiumPriceThb = Number(form.get('premiumPriceThb') || 0);
    clearQr = String(form.get('clearQr') || '') === 'true';
    const file = form.get('qrImage');
    if (file instanceof File && file.size > 0) {
      qrImage = Buffer.from(await file.arrayBuffer());
      qrImageMimeType = file.type || 'image/png';
    }
  } else {
    const body = await request.json();
    bankName = String(body.bankName || '');
    accountName = String(body.accountName || '');
    accountNumber = String(body.accountNumber || '');
    promptPayId = String(body.promptPayId || '');
    premiumPriceThb = Number(body.premiumPriceThb || 0);
    clearQr = Boolean(body.clearQr);
  }

  const data: Record<string, unknown> = {
    bankName,
    accountName,
    accountNumber,
    promptPayId,
    premiumPriceThb: Number.isFinite(premiumPriceThb) ? premiumPriceThb : 0,
  };

  if (qrImage) {
    data.qrImage = qrImage;
    data.qrImageMimeType = qrImageMimeType;
  } else if (clearQr) {
    data.qrImage = null;
    data.qrImageMimeType = null;
  }

  const settings = await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });

  return NextResponse.json({ success: true, id: settings.id });
}
