import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildProfitLossExcelHtml, downloadProfitLossExcel } from '../exportExcel';
import type { ProfitLossRow, ProfitLossTotals } from '../types';

vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils');
  return {
    ...actual,
    downloadBlob: vi.fn(),
  };
});

import { downloadBlob } from '../utils';

const rows: ProfitLossRow[] = [
  {
    period: '2026-07',
    sales: 100,
    purchases: 40,
    expenses: 10,
    purchasePricePerKg: 50,
    salePricePerKg: 60,
    net: 50,
  },
];

const totals: ProfitLossTotals = {
  sales: 100,
  purchases: 40,
  expenses: 10,
  net: 50,
};

describe('buildProfitLossExcelHtml', () => {
  it('includes column headers and totals', () => {
    const html = buildProfitLossExcelHtml({ rows, totals, viewMode: 'monthly' });

    expect(html).toContain('<th>Period</th>');
    expect(html).toContain('<th>Sales</th>');
    expect(html).toContain('<th>Net</th>');
    expect(html).toContain('<td><b>Total</b></td>');
    expect(html).toContain('100.00');
    expect(html).toContain('50.00');
  });

  it('renders one data row for each period', () => {
    const html = buildProfitLossExcelHtml({
      rows: [
        ...rows,
        {
          period: '2026-08',
          sales: 200,
          purchases: 80,
          expenses: 20,
          purchasePricePerKg: 55,
          salePricePerKg: 65,
          net: 100,
        },
      ],
      totals: { sales: 300, purchases: 120, expenses: 30, net: 150 },
      viewMode: 'monthly',
    });

    expect(html).toContain('200.00');
    expect(html).toContain('150.00');
  });
});

describe('downloadProfitLossExcel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('downloads an .xls blob with the report date range in the filename', () => {
    downloadProfitLossExcel({
      rows,
      totals,
      viewMode: 'monthly',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('application/vnd.ms-excel');
    expect(filename).toBe('profit-loss-2026-07-01-to-2026-07-31.xls');
  });
});
