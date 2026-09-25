import crypto from 'crypto';

export const SIGNUP_TOKEN_TTL_MS = 15 * 60 * 1000;
export const SIGNUP_RESEND_COOLDOWN_MS = 60 * 1000;
export const SIGNUP_MAX_ATTEMPTS = 5;

export const INVALID_SIGNUP_CODE = 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ';
export const SIGNUP_ATTEMPTS_EXCEEDED = 'ใส่รหัสผิดหลายครั้ง กรุณาสมัครใหม่';

export function hashSignupCode(slug: string, code: string): string {
  return crypto.createHash('sha256').update(`${slug}:${code}`).digest('hex');
}

export function createSignupCode(slug: string): { code: string; tokenHash: string; expiresAt: Date } {
  const code = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  return {
    code,
    tokenHash: hashSignupCode(slug, code),
    expiresAt: new Date(Date.now() + SIGNUP_TOKEN_TTL_MS),
  };
}

export function resendCooldownSeconds(sentAt: Date, now = Date.now()): number {
  const remaining = SIGNUP_RESEND_COOLDOWN_MS - (now - sentAt.getTime());
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 1000);
}
