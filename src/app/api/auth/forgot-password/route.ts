import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { isValidEmail, normalizeEmail } from '@/platform/email';
import { normalizeSlug } from '@/platform/slug';
import { sendPasswordResetEmail } from '@/platform/mail';
import { logger } from '@/shared/logger';
import {
  GENERIC_RESET_MESSAGE,
  appBaseUrl,
  createResetToken,
  pickShopAdmin,
} from '@/platform/passwordReset';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ''));
    const slug = body.slug ? normalizeSlug(String(body.slug)) : '';

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' },
        { status: 400 },
      );
    }

    const tenants = await prisma.tenant.findMany({
      where: { email },
      select: {
        id: true,
        slug: true,
        name: true,
        users: {
          where: { isActive: true, role: { in: ['admin', 'root'] } },
          select: { id: true, username: true, role: true, createdAt: true, isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (tenants.length > 1 && !slug) {
      return NextResponse.json(
        {
          success: false,
          needsSlug: true,
          message: 'อีเมลนี้ใช้กับหลายร้าน กรุณากรอกรหัสร้าน',
        },
        { status: 400 },
      );
    }

    const tenant = slug ? tenants.find((item) => item.slug === slug) : tenants[0];
    const admin = tenant ? pickShopAdmin(tenant.users) : null;

    if (!tenant || !admin) {
      return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
    }

    const { token, tokenHash, expiresAt } = createResetToken();

    await prisma.passwordResetToken.updateMany({
      where: { userId: admin.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: { userId: admin.id, tokenHash, expiresAt },
    });

    const resetUrl = `${appBaseUrl(request.nextUrl.origin)}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail({
        to: email,
        shopName: tenant.name,
        username: admin.username,
        resetUrl,
      });
    } catch (error) {
      logger.error('Failed to send password reset email', error);
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    logger.error('Forgot password failed', error);
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้' },
      { status: 500 },
    );
  }
}
