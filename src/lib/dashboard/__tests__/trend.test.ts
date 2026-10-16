import { describe, expect, it } from 'vitest';
import { buildSevenDayTrend, thailandDateKey } from '../trend';

describe('buildSevenDayTrend', () => {
  const todayStart = new Date('2026-10-15T17:00:00.000Z');

  it('returns seven Thailand days ending today', () => {
    const points = buildSevenDayTrend(todayStart, [], []);

    expect(points).toHaveLength(7);
    expect(points[6].date).toBe('2026-10-16');
    expect(points[0].date).toBe('2026-10-10');
    expect(points.map((point) => point.label)).toEqual(['ส', 'อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ']);
  });

  it('sums purchases and sales that fall on the same Thailand day', () => {
    const points = buildSevenDayTrend(
      todayStart,
      [
        { date: '2026-10-16T02:00:00.000Z', totalAmount: 100 },
        { date: '2026-10-15T18:00:00.000Z', totalAmount: 40 },
      ],
      [{ date: '2026-10-16T10:00:00.000Z', totalAmount: 25 }],
    );

    const today = points.find((point) => point.date === '2026-10-16');
    expect(today?.purchaseAmount).toBe(140);
    expect(today?.saleAmount).toBe(25);
  });

  it('ignores rows outside the seven day window', () => {
    const points = buildSevenDayTrend(
      todayStart,
      [{ date: '2026-10-01T00:00:00.000Z', totalAmount: 999 }],
      [],
    );

    expect(points.every((point) => point.purchaseAmount === 0)).toBe(true);
  });
});

describe('thailandDateKey', () => {
  it('uses the Thailand calendar date', () => {
    expect(thailandDateKey(new Date('2026-10-16T17:30:00.000Z'))).toBe('2026-10-17');
    expect(thailandDateKey(new Date('2026-10-16T16:30:00.000Z'))).toBe('2026-10-16');
  });
});
