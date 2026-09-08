import { describe, expect, it } from 'vitest';
import { gangOverlapsRange, parseGangDateRange } from '../dateRange';
import { DATE_FILTER_GANG_FIXTURES, fixtureGangNos } from './dateFilterFixtures';

function overlappingGangNos(startDate: string | null, endDate: string | null): number[] {
  const parsed = parseGangDateRange(startDate, endDate);
  if (!parsed.ok) {
    throw new Error(`invalid test range ${startDate} → ${endDate}`);
  }
  return fixtureGangNos(DATE_FILTER_GANG_FIXTURES.filter((gang) => gangOverlapsRange(gang, parsed)));
}

describe('gang date filters (วันที่เริ่มต้น / วันที่สิ้นสุด)', () => {
  it('has twelve sequential gangs from Jan through an open September cycle', () => {
    expect(DATE_FILTER_GANG_FIXTURES).toHaveLength(12);
    expect(DATE_FILTER_GANG_FIXTURES.map((g) => g.gangNo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(DATE_FILTER_GANG_FIXTURES.filter((g) => g.endDate == null)).toEqual([
      expect.objectContaining({ gangNo: 12, label: 'open since early September' }),
    ]);
  });

  it('July includes the June-straddle, fully-July, and July-August gangs', () => {
    expect(overlappingGangNos('2026-07-01', '2026-07-31')).toEqual([7, 8, 9]);
  });

  it('August includes gangs that straddle in/out plus the fully-August gang', () => {
    expect(overlappingGangNos('2026-08-01', '2026-08-31')).toEqual([9, 10, 11]);
  });

  it('September (same default window as the report page) includes the Aug-straddle and the open gang', () => {
    expect(overlappingGangNos('2026-09-01', '2026-09-08')).toEqual([11, 12]);
  });

  it('June includes the fully-June gang and the June-July straddle', () => {
    expect(overlappingGangNos('2026-06-01', '2026-06-30')).toEqual([6, 7]);
  });

  it('May includes the April-May straddle and the fully-May gang', () => {
    expect(overlappingGangNos('2026-05-01', '2026-05-31')).toEqual([4, 5]);
  });

  it('January includes only the January gang', () => {
    expect(overlappingGangNos('2026-01-01', '2026-01-31')).toEqual([1]);
  });

  it('a single day inside a closed gang still matches that gang', () => {
    expect(overlappingGangNos('2026-07-10', '2026-07-10')).toEqual([8]);
  });

  it('Q2 (Apr–Jun) excludes January–March and July onward', () => {
    expect(overlappingGangNos('2026-04-01', '2026-06-30')).toEqual([4, 5, 6, 7]);
  });

  it('the full year returns every fixture gang, including the open one', () => {
    expect(overlappingGangNos('2026-01-01', '2026-12-31')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('startDate only keeps gangs that have not ended before that day (includes open)', () => {
    expect(overlappingGangNos('2026-07-01', null)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it('endDate only keeps gangs that started on or before that day', () => {
    expect(overlappingGangNos(null, '2026-07-31')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('a range after every closed gang still includes the open September gang', () => {
    expect(overlappingGangNos('2026-09-10', '2026-09-30')).toEqual([12]);
  });

  it('a range before any gang returns none', () => {
    expect(overlappingGangNos('2025-01-01', '2025-12-31')).toEqual([]);
  });

  it('rejects startDate after endDate', () => {
    expect(parseGangDateRange('2026-07-31', '2026-07-01')).toEqual({ ok: false });
  });
});
