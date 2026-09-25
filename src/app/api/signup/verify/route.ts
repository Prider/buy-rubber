import { NextRequest, NextResponse } from 'next/server';
import { generateToken, type TenantPlan, type TenantStatus } from '@/platform/auth';
import { prisma } from '@/platform/prisma';
import { logger } from '@/shared/logger';
import { provisionTenant } from '@/platform/provisionTenant';
import { seedRubberTenant } from '@/industries/rubber/seed';
import { validateSlug } from '@/platform/slug';
import {
  SIGNUP_MAX_ATTEMPTS,
  SIGNUP_ATTEMPTS_EXCEEDED,
  INVALID_SIGNUP_CODE,
  hashSignupCode,
} from '@/platform/signupVerification';
import { SIGNUP_VERIFY_RATE_LIMIT, clientIp, rateLimit } from '@/platform/rateLimit';

export const runtime = 'nodejs';

class VerifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerifyError';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slugResult = validateSlug(String(body.slug || ''));
    const code = String(body.code || '').trim();

    if (!slugResult.ok || !/^\d{4}$/.test(code)) {
      return NextResponse.json({ success: false, message: INVALID_SIGNUP_CODE }, { status: 400 });
    }

    const limited = rateLimit(
      `signup-verify:${clientIp(request)}`,
      SIGNUP_VERIFY_RATE_LIMIT.limit,
      SIGNUP_VERIFY_RATE_LIMIT.windowMs,
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
    if (!pending || pending.expiresAt.getTime() <= Date.now()) {
      if (pending) {
        try {
          await prisma.pendingSignup.delete({ where: { id: pending.id } });
        } catch {
          // The row may already be gone.
        }
      }
      return NextResponse.json({ success: false, message: INVALID_SIGNUP_CODE }, { status: 400 });
    }

    if (pending.failedAttempts >= SIGNUP_MAX_ATTEMPTS) {
      await prisma.pendingSignup.delete({ where: { id: pending.id } });
      return NextResponse.json({ success: false, message: SIGNUP_ATTEMPTS_EXCEEDED }, { status: 400 });
    }

    if (pending.tokenHash !== hashSignupCode(pending.slug, code)) {
      const updated = await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: { failedAttempts: { increment: 1 } },
        select: { failedAttempts: true },
      });
      if (updated.failedAttempts >= SIGNUP_MAX_ATTEMPTS) {
        try {
          await prisma.pendingSignup.delete({ where: { id: pending.id } });
        } catch {
          // Another request already removed the row.
        }
        return NextResponse.json({ success: false, message: SIGNUP_ATTEMPTS_EXCEEDED }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: INVALID_SIGNUP_CODE }, { status: 400 });
    }

    const plan = pending.plan === 'premium' ? 'premium' : 'freemium';
    const status = plan === 'premium' ? 'not_yet_payment' : 'active';

    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const claimed = await tx.pendingSignup.deleteMany({
        where: { id: pending.id, tokenHash: pending.tokenHash },
      });
      if (claimed.count !== 1) {
        throw new VerifyError(INVALID_SIGNUP_CODE);
      }

      const taken = await tx.tenant.findUnique({
        where: { slug: pending.slug },
        select: { id: true },
      });
      if (taken) {
        throw new VerifyError('รหัสร้านนี้ถูกใช้แล้ว');
      }

      return provisionTenant({
        slug: pending.slug,
        name: pending.companyName,
        email: pending.email,
        address: pending.companyAddress,
        plan: plan as TenantPlan,
        status,
        adminUsername: pending.username,
        adminPassword: pending.passwordHash,
        passwordAlreadyHashed: true,
        adminRole: 'admin',
        industry: 'rubber',
        seed: seedRubberTenant,
      }, tx);
    });

    const session = generateToken({
      kind: 'shop',
      userId: user.id,
      username: user.username,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      plan: tenant.plan as TenantPlan,
      tenantStatus: tenant.status as TenantStatus,
    });

    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      token: session,
      user: {
        ...userWithoutPassword,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        plan: tenant.plan,
        tenantStatus: tenant.status,
      },
      next: plan === 'premium' ? '/signup/payment' : '/dashboard',
    });
  } catch (error) {
    if (error instanceof VerifyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    logger.error('Signup verify failed', error);
    return NextResponse.json({ success: false, message: 'ไม่สามารถยืนยันอีเมลได้' }, { status: 500 });
  }
}
