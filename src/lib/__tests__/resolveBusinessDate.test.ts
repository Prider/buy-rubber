import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveBusinessDate } from '../resolveBusinessDate';

describe('resolveBusinessDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stamps current local time onto date-only YYYY-MM-DD strings', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 8, 14, 30, 37, 0)); // local Sep 8 14:30:37

    const result = resolveBusinessDate('2026-09-08');

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(37);
  });

  it('preserves explicit datetime strings', () => {
    const result = resolveBusinessDate('2026-09-08T10:15:00');
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(15);
  });

  it('falls back when date is missing', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 2, 9, 0, 0, 0));
    expect(resolveBusinessDate(undefined).getTime()).toBe(new Date(2026, 0, 2, 9, 0, 0, 0).getTime());
  });
});
