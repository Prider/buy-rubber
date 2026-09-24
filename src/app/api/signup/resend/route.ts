import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { isValidEmail, normalizeEmail } from '@/lib/email';
import { validateSlug } from '@/lib/slug';
import { sendSignupVerificationEmail } from '@/lib/mail';
import {
  SIGNUP_RESEND_COOLDOWN_MS,
  createSignupCode,
  resendCooldownSeconds,
} from '@/lib/signupVerification';
import { SIGNUP_RESEND_RATE_LIMIT, clientIp, rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const NOT_FOUND = 'ไม่พบการสมัครที่รอการยืนยัน กรุณาสมัครใหม่';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ''));
    const slugResult = validateSlug(String(body.slug || ''));

    if (!slugResult.ok) {
      return NextResponse.json({ success: false, message: slugResult.message }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' }, { status: 400 });
    }

    const limited = rateLimit(
      `signup-resend:${clientIp(request)}`,
      SIGNUP_RESEND_RATE_LIMIT.limit,
      SIGNUP_RESEND_RATE_LIMIT.windowMs,
    );
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง', retryAfterSeconds: limited.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
      );
    }

    const pending = await prisma.pendingSignup.findUnique({
      where: { slug: slugResult.slug },
    });
    const now = new Date();

    if (!pending || pending.email !== email) {
      return NextResponse.json({ success: false, message: NOT_FOUND }, { status: 400 });
    }

    if (pending.expiresAt.getTime() <= now.getTime()) {
      await prisma.pendingSignup.delete({ where: { id: pending.id } });
      return NextResponse.json({ success: false, message: NOT_FOUND }, { status: 400 });
    }

    const retryAfterSeconds = resendCooldownSeconds(pending.sentAt, now.getTime());
    if (retryAfterSeconds > 0) {
      return NextResponse.json(
        { success: false, message: 'กรุณารอสักครู่ก่อนส่งอีเมลอีกครั้ง', retryAfterSeconds },
        { status: 429 },
      );
    }

    const next = createSignupCode(pending.slug);
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: {
        tokenHash: next.tokenHash,
        expiresAt: next.expiresAt,
        sentAt: now,
        failedAttempts: 0,
      },
    });

    try {
      await sendSignupVerificationEmail({
        to: pending.email,
        shopName: pending.companyName,
        code: next.code,
      });
    } catch (error) {
      logger.error('Failed to resend signup verification email', error);
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: {
          tokenHash: pending.tokenHash,
          expiresAt: pending.expiresAt,
          sentAt: pending.sentAt,
          failedAttempts: pending.failedAttempts,
        },
      });
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cooldownSeconds: SIGNUP_RESEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    logger.error('Signup resend failed', error);
    return NextResponse.json({ success: false, message: 'ไม่สามารถส่งอีเมลยืนยันได้' }, { status: 500 });
  }
}
