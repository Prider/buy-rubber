import { NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { bytesToDataUrl, promptPayQrDataUrl } from '@/platform/promptPayQr';

export const runtime = 'nodejs';

async function getSettings() {
  return prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
}

export async function GET() {
  const settings = await getSettings();
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
  });
}
