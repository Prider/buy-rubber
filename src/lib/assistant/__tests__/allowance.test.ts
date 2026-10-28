import { describe, expect, it } from 'vitest';
import { allowanceFromHeaders, allowanceFromOpenRouterKey, describeAllowance, modelAllowanceRows } from '../allowance';

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe('assistant allowance', () => {
  it('describes the tokens left in the current rate-limit window', () => {
    const allowance = allowanceFromHeaders(
      'anthropic',
      headers({
        'anthropic-ratelimit-tokens-remaining': '12000',
        'anthropic-ratelimit-tokens-limit': '30000',
        'anthropic-ratelimit-tokens-reset': '2026-10-28T09:00:00.000Z',
      }),
    );

    expect(allowance?.remaining).toBe(12000);
    expect(describeAllowance(allowance!).summary).toBe('โทเคนคงเหลือ 12,000');
    expect(describeAllowance(allowance!).detail).toContain('จาก 30,000 ในรอบนี้');
  });

  it('describes OpenRouter credit remaining', () => {
    const allowance = allowanceFromOpenRouterKey({
      data: { limit: 100, limit_remaining: 74.5, effective_budget: { remaining_usd: 17.5, limit_usd: 50 } },
    });

    expect(describeAllowance(allowance!).summary).toBe('เครดิตคงเหลือ 17.50 ดอลลาร์');
    expect(describeAllowance(allowance!).detail).toContain('จาก 50.00 ดอลลาร์');
  });

  it('keeps a row for every model, including one that has not been checked', () => {
    const rows = modelAllowanceRows(['gpt-4o-mini', 'gpt-4o', 'gpt-4o-mini'], {
      'gpt-4o-mini': { unit: 'tokens', remaining: 8000, limit: 10000, resetsAt: null },
    });

    expect(rows.map((row) => row.model)).toEqual(['gpt-4o-mini', 'gpt-4o']);
    expect(rows[0]?.summary).toBe('โทเคนคงเหลือ 8,000');
    expect(rows[1]?.summary).toBe('โทเคนคงเหลือ ยังไม่ทราบ');
  });
});
