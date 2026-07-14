import { describe, expect, it } from 'vitest';
import { isDateRangeInvalid, periodLabel, toInputDate } from '../utils';

describe('profit-loss utils', () => {
  describe('toInputDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(toInputDate(new Date(2026, 6, 14))).toBe('2026-07-14');
    });

    it('zero-pads month and day', () => {
      expect(toInputDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('periodLabel', () => {
    it('formats monthly periods', () => {
      const label = periodLabel('2026-07', 'monthly');
      expect(label).toContain('2569');
      expect(label.length).toBeGreaterThan(0);
    });

    it('formats daily periods', () => {
      const label = periodLabel('2026-07-14', 'daily');
      expect(label.length).toBeGreaterThan(0);
    });

    it('formats weekly periods as a date range', () => {
      // Monday 2026-07-13 → Sunday 2026-07-19
      const label = periodLabel('2026-07-13', 'weekly');
      expect(label).toContain('–');
      expect(label.length).toBeGreaterThan(0);
    });
  });

  describe('isDateRangeInvalid', () => {
    it('returns true when start is after end', () => {
      expect(isDateRangeInvalid('2026-07-15', '2026-07-14')).toBe(true);
    });

    it('returns false when start equals end', () => {
      expect(isDateRangeInvalid('2026-07-14', '2026-07-14')).toBe(false);
    });

    it('returns false when start is before end', () => {
      expect(isDateRangeInvalid('2026-07-01', '2026-07-14')).toBe(false);
    });
  });
});
