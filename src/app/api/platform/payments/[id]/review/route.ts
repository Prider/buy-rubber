import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { logger } from '@/shared/logger';
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/platform/mail';
import { appBaseUrl, pickShopAdmin } from '@/platform/passwordReset';
import { requirePlatformAuth } from '@/platform/tenant';

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
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          slug: true,
          name: true,
          email: true,
          status: true,
          users: {
            where: { isActive: true, role: { in: ['admin', 'root'] } },
            select: { id: true, username: true, role: true, createdAt: true, isActive: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
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

    const admin = pickShopAdmin(payment.tenant.users);
    const email = payment.tenant.email?.trim() || '';
    const loginUrl = `${appBaseUrl(request.nextUrl.origin)}/login?slug=${encodeURIComponent(payment.tenant.slug)}`;
    let message = 'อนุมัติแล้ว และส่งอีเมลแจ้งผู้ใช้แล้ว';
    let emailSent = false;

    if (!email || !admin) {
      logger.error('Payment approved without email recipient', {
        paymentId: payment.id,
        tenantId: payment.tenantId,
        hasEmail: Boolean(email),
        hasAdmin: Boolean(admin),
      });
      message = 'อนุมัติแล้ว แต่ไม่พบอีเมลหรือชื่อผู้ใช้ของร้าน จึงส่งอีเมลไม่ได้';
    } else {
      try {
        await sendPaymentApprovedEmail({
          to: email,
          shopName: payment.tenant.name,
          slug: payment.tenant.slug,
          username: admin.username,
          loginUrl,
        });
        emailSent = true;
      } catch (error) {
        logger.error('Failed to send payment approved email', error);
        message = 'อนุมัติแล้ว แต่ส่งอีเมลไม่สำเร็จ';
      }
    }

    return NextResponse.json({ success: true, status: 'approved', emailSent, message });
  }

  const wasNewPremiumSignup = payment.tenant.status === 'pending_payment';
  const reason = rejectReason || 'สลิปไม่ถูกต้อง';
  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: payment.id },
      data: {
        status: 'rejected',
        reviewedBy: auth.auth.userId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
    }),
    prisma.tenant.update({
      where: { id: payment.tenantId },
      data: wasNewPremiumSignup
        ? { status: 'rejected' }
        : { status: 'active' },
    }),
  ]);

  const admin = pickShopAdmin(payment.tenant.users);
  const email = payment.tenant.email?.trim() || '';
  const loginUrl = `${appBaseUrl(request.nextUrl.origin)}/login?slug=${encodeURIComponent(payment.tenant.slug)}`;
  let message = 'ปฏิเสธแล้ว และส่งอีเมลให้ผู้ใช้อัปโหลดสลิปใหม่แล้ว';
  let emailSent = false;

  if (!email || !admin) {
    logger.error('Payment rejected without email recipient', {
      paymentId: payment.id,
      tenantId: payment.tenantId,
      hasEmail: Boolean(email),
      hasAdmin: Boolean(admin),
    });
    message = 'ปฏิเสธแล้ว แต่ไม่พบอีเมลหรือชื่อผู้ใช้ของร้าน จึงส่งอีเมลไม่ได้';
  } else {
    try {
      await sendPaymentRejectedEmail({
        to: email,
        shopName: payment.tenant.name,
        slug: payment.tenant.slug,
        username: admin.username,
        loginUrl,
        reason,
      });
      emailSent = true;
    } catch (error) {
      logger.error('Failed to send payment rejected email', error);
      message = 'ปฏิเสธแล้ว แต่ส่งอีเมลไม่สำเร็จ';
    }
  }

  return NextResponse.json({ success: true, status: 'rejected', emailSent, message });
}
