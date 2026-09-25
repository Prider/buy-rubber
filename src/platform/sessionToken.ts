import type { NextRequest } from 'next/server';
import { verifyToken, type AuthKind, type TenantPlan, type TenantStatus } from '@/platform/auth';
import { isAdminLike } from '@/platform/types/user';

export interface DecodedTokenPayload {
  kind?: AuthKind;
  userId: string;
  username: string;
  role: string;
  tenantId?: string;
  tenantSlug?: string;
  plan?: TenantPlan;
  tenantStatus?: TenantStatus;
  exp?: number;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  if (typeof atob !== 'undefined') {
    return atob(padded);
  }

  return Buffer.from(padded, 'base64').toString('utf-8');
}

function decodeLegacyToken(token: string): DecodedTokenPayload | null {
  try {
    const decoded = JSON.parse(
      typeof atob !== 'undefined'
        ? atob(token)
        : Buffer.from(token, 'base64').toString('utf-8')
    );

    if (!decoded.userId || !decoded.role) {
      return null;
    }

    return {
      kind: decoded.kind,
      userId: decoded.userId,
      username: decoded.username || 'Unknown',
      role: decoded.role,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      plan: decoded.plan,
      tenantStatus: decoded.tenantStatus,
    };
  } catch {
    return null;
  }
}

/** Client-safe JWT payload decode (signature not verified). */
export function decodeTokenPayload(token: string): DecodedTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(base64UrlDecode(parts[1]));

      if (!payload.userId || !payload.role) {
        return null;
      }

      return {
        kind: payload.kind,
        userId: payload.userId,
        username: payload.username || 'Unknown',
        role: payload.role,
        tenantId: payload.tenantId,
        tenantSlug: payload.tenantSlug,
        plan: payload.plan,
        tenantStatus: payload.tenantStatus,
        exp: payload.exp,
      };
    }

    return decodeLegacyToken(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload) {
    return true;
  }

  // Legacy base64 tokens have no expiry — force re-login after JWT migration.
  if (payload.exp === undefined) {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  clearAuthSession();
  window.location.href = '/login';
}

export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/** Server-side token verification (signature + expiry). */
export function getVerifiedUserFromToken(
  token: string
): DecodedTokenPayload | null {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    kind: payload.kind,
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
    plan: payload.plan,
    tenantStatus: payload.tenantStatus,
  };
}

export function verifyAdminRole(request: NextRequest): boolean {
  const token = getBearerToken(request);
  if (!token) {
    return false;
  }

  const user = getVerifiedUserFromToken(token);
  return isAdminLike(user?.role);
}
