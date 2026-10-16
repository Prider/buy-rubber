import { describe, expect, it } from 'vitest';
import { isWithinPeriod, productTypeMatches } from '../activity';

const bounds = {
  todayStart: '2026-10-15T17:00:00.000Z',
  tomorrow: '2026-10-16T17:00:00.000Z',
  monthStart: '2026-09-30T17:00:00.000Z',
  nextMonth: '2026-10-31T17:00:00.000Z',
};

describe('isWithinPeriod', () => {
  it('keeps rows inside the selected Thailand day', () => {
    expect(isWithinPeriod('2026-10-16T02:00:00.000Z', 'today', bounds)).toBe(true);
    expect(isWithinPeriod('2026-10-15T02:00:00.000Z', 'today', bounds)).toBe(false);
  });

  it('keeps earlier days of the month when the period is the month', () => {
    expect(isWithinPeriod('2026-10-02T02:00:00.000Z', 'month', bounds)).toBe(true);
    expect(isWithinPeriod('2026-09-30T02:00:00.000Z', 'month', bounds)).toBe(false);
  });
});

describe('productTypeMatches', () => {
  it('matches either productTypeId or the nested product type', () => {
    expect(productTypeMatches({ productTypeId: 'sheet' }, 'sheet')).toBe(true);
    expect(productTypeMatches({ productType: { id: 'cup' } }, 'cup')).toBe(true);
    expect(productTypeMatches({ productTypeId: 'sheet' }, null)).toBe(true);
    expect(productTypeMatches({ productTypeId: 'sheet' }, 'cup')).toBe(false);
  });
});
