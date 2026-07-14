import { describe, expect, it } from 'vitest';
import { buildProfitLossPdfPages, generateProfitLossPdfHtml } from '../exportPdf';
import type { ProfitLossRow, ProfitLossTotals } from '../types';

function makeRow(period: string, net = 10): ProfitLossRow {
  return {
    period,
    sales: 100,
    purchases: 40,
    expenses: 10,
    purchasePricePerKg: 50,
    salePricePerKg: 60,
    net,
  };
}

const totals: ProfitLossTotals = {
  sales: 100,
  purchases: 40,
  expenses: 10,
  net: 50,
};

describe('buildProfitLossPdfPages', () => {
  it('returns empty array for no rows', () => {
    expect(buildProfitLossPdfPages([])).toEqual([]);
  });

  it('puts all rows on one page when they fit', () => {
    const rows = [makeRow('2026-01'), makeRow('2026-02'), makeRow('2026-03')];
    const pages = buildProfitLossPdfPages(rows, 26, 34);

    expect(pages).toHaveLength(1);
    expect(pages[0].periodRows).toHaveLength(3);
    expect(pages[0].showFullHeader).toBe(true);
    expect(pages[0].showSummary).toBe(true);
    expect(pages[0].showPeriodTotal).toBe(true);
    expect(pages[0].showFooter).toBe(true);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].totalPages).toBe(1);
  });

  it('splits across pages using first-page and per-page slot sizes', () => {
    const rows = Array.from({ length: 8 }, (_, i) => makeRow(`2026-${String(i + 1).padStart(2, '0')}`));
    const pages = buildProfitLossPdfPages(rows, 3, 4);

    expect(pages).toHaveLength(3);
    expect(pages[0].periodRows).toHaveLength(3);
    expect(pages[1].periodRows).toHaveLength(4);
    expect(pages[2].periodRows).toHaveLength(1);

    expect(pages[0].showFullHeader).toBe(true);
    expect(pages[1].showFullHeader).toBe(false);
    expect(pages[1].showSummary).toBe(false);

    expect(pages[0].showPeriodTotal).toBe(false);
    expect(pages[2].showPeriodTotal).toBe(true);
    expect(pages[2].showFooter).toBe(true);
    expect(pages[2].pageNumber).toBe(3);
    expect(pages[2].totalPages).toBe(3);
  });

  it('never includes a Trend data section', () => {
    const rows = [makeRow('2026-01')];
    const pages = buildProfitLossPdfPages(rows);
    const html = generateProfitLossPdfHtml({
      page: pages[0],
      totals,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      viewMode: 'monthly',
      printedAt: new Date('2026-07-14T10:00:00'),
    });

    expect(html).not.toContain('Trend data');
    expect(html).toContain('Period breakdown');
    expect(html).toContain('Net Profit');
  });
});

describe('generateProfitLossPdfHtml', () => {
  it('marks loss when net is negative', () => {
    const [page] = buildProfitLossPdfPages([makeRow('2026-01', -20)]);
    const html = generateProfitLossPdfHtml({
      page,
      totals: { ...totals, net: -20 },
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      viewMode: 'monthly',
      printedAt: new Date('2026-07-14T10:00:00'),
    });

    expect(html).toContain('Net Loss');
  });

  it('uses continued title on continuation pages', () => {
    const pages = buildProfitLossPdfPages(
      Array.from({ length: 5 }, (_, i) => makeRow(`2026-0${i + 1}`)),
      2,
      2
    );
    const html = generateProfitLossPdfHtml({
      page: pages[1],
      totals,
      startDate: '2026-01-01',
      endDate: '2026-05-31',
      viewMode: 'monthly',
      printedAt: new Date('2026-07-14T10:00:00'),
    });

    expect(html).toContain('Period breakdown (continued)');
    expect(html).toContain('หน้า 2/3');
    expect(html).not.toContain('ผลลัพธ์สุทธิ');
  });
});
