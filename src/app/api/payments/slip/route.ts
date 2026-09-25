import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { requireTenantAuth } from '@/platform/tenant';
import { bytesToDataUrl } from '@/platform/promptPayQr';

export const runtime = 'nodejs';

const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth(request, { allowPending: true });
  if (!auth.ok) return auth.response;

  const requestRow = await prisma.paymentRequest.findFirst({
    where: { tenantId: auth.auth.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  if (!requestRow) {
    return NextResponse.json({ request: null, tenantStatus: auth.auth.tenantStatus, plan: auth.auth.plan });
  }

  return NextResponse.json({
    tenantStatus: auth.auth.tenantStatus,
    plan: auth.auth.plan,
    request: {
      id: requestRow.id,
      status: requestRow.status,
      amount: requestRow.amount,
      rejectReason: requestRow.rejectReason,
      createdAt: requestRow.createdAt,
      slipDataUrl: bytesToDataUrl(requestRow.slipImage, requestRow.slipMimeType),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantAuth(request, { allowPending: true });
  if (!auth.ok) return auth.response;

  const form = await request.formData();
  const file = form.get('slip');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, message: 'กรุณาอัปโหลดสลิปการโอนเงิน' }, { status: 400 });
  }
  if (file.size > MAX_SLIP_BYTES) {
    return NextResponse.json({ success: false, message: 'ไฟล์สลิปใหญ่เกิน 5MB' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, message: 'รองรับเฉพาะไฟล์รูปภาพ' }, { status: 400 });
  }

  const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
  const amount = settings?.premiumPriceThb ?? 0;
  const buffer = Buffer.from(await file.arrayBuffer());

  const open = await prisma.paymentRequest.findFirst({
    where: { tenantId: auth.auth.tenantId, status: 'pending' },
  });

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.auth.tenantId } });
  const isUpgrade = tenant?.status === 'active';

  const row = open
    ? await prisma.paymentRequest.update({
        where: { id: open.id },
        data: {
          amount,
          slipImage: buffer,
          slipMimeType: file.type,
          status: 'pending',
          rejectReason: null,
        },
      })
    : await prisma.paymentRequest.create({
        data: {
          tenantId: auth.auth.tenantId,
          amount,
          slipImage: buffer,
          slipMimeType: file.type,
          status: 'pending',
        },
      });

  if (!isUpgrade) {
    await prisma.tenant.update({
      where: { id: auth.auth.tenantId },
      data: { status: 'pending_payment', plan: 'premium' },
    });
  }

  return NextResponse.json({
    success: true,
    requestId: row.id,
    status: row.status,
  });
}
