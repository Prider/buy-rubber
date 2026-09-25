type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const SIGNUP_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
export const SIGNUP_RESEND_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
export const SIGNUP_VERIFY_RATE_LIMIT = { limit: 30, windowMs: 15 * 60 * 1000 };

export function clientIp(request: { headers: Headers }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'unknown';
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function resetRateLimits(): void {
  buckets.clear();
}
