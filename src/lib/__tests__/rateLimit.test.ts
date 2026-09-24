import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, resetRateLimits } from '../rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows requests inside the window and blocks the next one', () => {
    const now = 1_000_000;
    expect(rateLimit('signup:1.1.1.1', 2, 60_000, now)).toEqual({ ok: true });
    expect(rateLimit('signup:1.1.1.1', 2, 60_000, now + 1)).toEqual({ ok: true });
    expect(rateLimit('signup:1.1.1.1', 2, 60_000, now + 2)).toEqual({
      ok: false,
      retryAfterSeconds: 60,
    });
  });

  it('starts a new window after the previous one expires', () => {
    const now = 1_000_000;
    rateLimit('signup:1.1.1.1', 1, 60_000, now);
    expect(rateLimit('signup:1.1.1.1', 1, 60_000, now + 60_000)).toEqual({ ok: true });
  });

  it('counts keys separately', () => {
    expect(rateLimit('signup:1.1.1.1', 1, 60_000, 0)).toEqual({ ok: true });
    expect(rateLimit('signup:2.2.2.2', 1, 60_000, 0)).toEqual({ ok: true });
  });
});
