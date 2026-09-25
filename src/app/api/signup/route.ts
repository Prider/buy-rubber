import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { TenantPlan } from '@/platform/auth';
import { hashPassword } from '@/platform/auth';
import { validateSlug } from '@/platform/slug';
import { isValidEmail, normalizeEmail } from '@/platform/email';
import { prisma } from '@/platform/prisma';
import { logger } from '@/shared/logger';
import { sendSignupVerificationEmail } from '@/platform/mail';
import {
  SIGNUP_RESEND_COOLDOWN_MS,
  createSignupCode,
} from '@/platform/signupVerification';
import { SIGNUP_RATE_LIMIT, clientIp, rateLimit } from '@/platform/rateLimit';

export const runtime = 'nodejs';

const SLUG_TAKEN = 'รหัสร้านนี้ถูกใช้แล้ว';

function isSlugTaken(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : typeof target === 'string' ? [target] : [];
  return fields.some((field) => field === 'slug' || field.includes('slug'));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan: TenantPlan = body.plan === 'premium' ? 'premium' : 'freemium';
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const name = String(body.companyName || '').trim();
    const address = String(body.companyAddress || '').trim();
    const email = normalizeEmail(String(body.email || ''));
    const slugResult = validateSlug(String(body.slug || ''));

    if (!slugResult.ok) {
      return NextResponse.json({ success: false, message: slugResult.message }, { status: 400 });
    }
    if (!username || username.length < 2) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อร้านสำหรับสลิป' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' }, { status: 400 });
    }

    const limited = rateLimit(
      `signup:${clientIp(request)}`,
      SIGNUP_RATE_LIMIT.limit,
      SIGNUP_RATE_LIMIT.windowMs,
    );
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง', retryAfterSeconds: limited.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
      );
    }

    const existing = await prisma.tenant.findUnique({
      where: { slug: slugResult.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: SLUG_TAKEN }, { status: 409 });
    }

    const now = new Date();
    await prisma.pendingSignup.deleteMany({
      where: { slug: slugResult.slug, expiresAt: { lte: now } },
    });

    const pendingSlug = await prisma.pendingSignup.findUnique({
      where: { slug: slugResult.slug },
      select: { id: true },
    });
    if (pendingSlug) {
      return NextResponse.json({ success: false, message: SLUG_TAKEN }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const { code, tokenHash, expiresAt } = createSignupCode(slugResult.slug);
    const pending = await prisma.pendingSignup.create({
      data: {
        slug: slugResult.slug,
        username,
        passwordHash,
        email,
        companyName: name,
        companyAddress: address,
        plan,
        tokenHash,
        failedAttempts: 0,
        expiresAt,
        sentAt: now,
      },
    });

    try {
      await sendSignupVerificationEmail({
        to: email,
        shopName: name,
        code,
      });
    } catch (error) {
      logger.error('Failed to send signup verification email', error);
      await prisma.pendingSignup.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      email,
      slug: slugResult.slug,
      cooldownSeconds: SIGNUP_RESEND_COOLDOWN_MS / 1000,
    }, { status: 201 });
  } catch (error) {
    if (isSlugTaken(error)) {
      return NextResponse.json({ success: false, message: SLUG_TAKEN }, { status: 409 });
    }
    logger.error('Signup failed', error);
    return NextResponse.json({ success: false, message: 'ไม่สามารถสมัครใช้งานได้' }, { status: 500 });
  }
}
