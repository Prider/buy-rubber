import crypto from 'crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const GENERIC_RESET_MESSAGE =
  'ถ้าอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว';

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

export type ShopAdminCandidate = {
  id: string;
  username: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
};

export function pickShopAdmin<T extends ShopAdminCandidate>(users: T[]): T | null {
  const active = users.filter((user) => user.isActive);
  const byCreated = (a: T, b: T) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const admins = active.filter((user) => user.role === 'admin').sort(byCreated);
  if (admins[0]) return admins[0];
  const roots = active.filter((user) => user.role === 'root').sort(byCreated);
  return roots[0] ?? null;
}

export function appBaseUrl(origin: string): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  return configured || origin;
}
