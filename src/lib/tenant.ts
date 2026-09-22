import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TenantPlan, TenantStatus } from '@/lib/auth';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

export interface TenantAuth {
  userId: string;
  username: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  plan: TenantPlan;
  tenantStatus: TenantStatus;
}

export interface PlatformAuth {
  userId: string;
  username: string;
}

export type TenantAuthResult =
  | { ok: true; auth: TenantAuth }
  | { ok: false; response: NextResponse };

export type PlatformAuthResult =
  | { ok: true; auth: PlatformAuth }
  | { ok: false; response: NextResponse };

const UNAUTH = NextResponse.json(
  { success: false, message: 'Authentication required' },
  { status: 401 },
);

const FORBIDDEN_PENDING = NextResponse.json(
  {
    success: false,
    message: 'บัญชีนี้รอตรวจสอบสลิปชำระเงิน ยังไม่สามารถใช้งานระบบได้',
    code: 'PENDING_PAYMENT',
  },
  { status: 403 },
);

export async function requireTenantAuth(
  request: NextRequest,
  options?: { allowPending?: boolean },
): Promise<TenantAuthResult> {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: UNAUTH };
  }

  const payload = getVerifiedUserFromToken(token);
  if (!payload || payload.kind === 'platform' || !payload.tenantId) {
    return { ok: false, response: UNAUTH };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { id: true, slug: true, plan: true, status: true },
  });

  if (!tenant) {
    return { ok: false, response: UNAUTH };
  }

  const allowPending = options?.allowPending === true;
  if (!allowPending && tenant.status !== 'active') {
    return { ok: false, response: FORBIDDEN_PENDING };
  }

  return {
    ok: true,
    auth: {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      plan: tenant.plan as TenantPlan,
      tenantStatus: tenant.status as TenantStatus,
    },
  };
}

export async function requirePlatformAuth(request: NextRequest): Promise<PlatformAuthResult> {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, response: UNAUTH };
  }

  const payload = getVerifiedUserFromToken(token);
  if (!payload || payload.kind !== 'platform') {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Platform access required' },
        { status: 403 },
      ),
    };
  }

  const owner = await prisma.platformUser.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, isActive: true },
  });

  if (!owner?.isActive) {
    return { ok: false, response: UNAUTH };
  }

  return { ok: true, auth: { userId: owner.id, username: owner.username } };
}

export function isPremiumActive(auth: Pick<TenantAuth, 'plan' | 'tenantStatus'>): boolean {
  return auth.plan === 'premium' && auth.tenantStatus === 'active';
}
