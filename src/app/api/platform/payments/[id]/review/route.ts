import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAuth } from '@/lib/tenant';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requirePlatformAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const action = body.action === 'reject' ? 'reject' : 'approve';
  const rejectReason = String(body.rejectReason || '').trim();

  const payment = await prisma.paymentRequest.findUnique({
    where: { id: params.id },
    include: { tenant: true },
  });

  if (!payment) {
    return NextResponse.json({ success: false, message: 'ไม่พบรายการ' }, { status: 404 });
  }

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.paymentRequest.update({
        where: { id: payment.id },
        data: {
          status: 'approved',
          reviewedBy: auth.auth.userId,
          reviewedAt: new Date(),
          rejectReason: null,
        },
      }),
      prisma.tenant.update({
        where: { id: payment.tenantId },
        data: { plan: 'premium', status: 'active' },
      }),
    ]);
    return NextResponse.json({ success: true, status: 'approved' });
  }

  const wasNewPremiumSignup = payment.tenant.status === 'pending_payment';
  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: payment.id },
      data: {
        status: 'rejected',
        reviewedBy: auth.auth.userId,
        reviewedAt: new Date(),
        rejectReason: rejectReason || 'สลิปไม่ถูกต้อง',
      },
    }),
    prisma.tenant.update({
      where: { id: payment.tenantId },
      data: wasNewPremiumSignup
        ? { status: 'rejected' }
        : { status: 'active' },
    }),
  ]);

  return NextResponse.json({ success: true, status: 'rejected' });
}
