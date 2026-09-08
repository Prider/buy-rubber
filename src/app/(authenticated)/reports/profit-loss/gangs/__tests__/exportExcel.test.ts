import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGangsExcelHtml, downloadGangsExcel } from '../exportExcel';

vi.mock('../../utils', async () => {
  const actual = await vi.importActual<typeof import('../../utils')>('../../utils');
  return {
    ...actual,
    downloadBlob: vi.fn(),
  };
});

import { downloadBlob } from '../../utils';

const rows = [
  {
    gangNo: 1,
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    soldKg: 100,
    revenue: 5000,
    cogs: 4000,
    profitLoss: 1000,
    salesCount: 2,
  },
];

const summary = {
  soldKg: 100,
  revenue: 5000,
  cogs: 4000,
  profitLoss: 1000,
};

const product = { code: 'R1', name: 'ยาง' };

describe('buildGangsExcelHtml', () => {
  it('includes product, headers, row and totals', () => {
    const html = buildGangsExcelHtml({ rows, summary, product });

    expect(html).toContain('R1');
    expect(html).toContain('ยาง');
    expect(html).toContain('<th>กอง</th>');
    expect(html).toContain('<th>กำไร/ขาดทุน</th>');
    expect(html).toContain('100.00');
    expect(html).toContain('1000.00');
    expect(html).toContain('<td colspan="3"><b>รวม</b></td>');
  });

  it('includes the selected date range when provided', () => {
    const html = buildGangsExcelHtml({
      rows,
      summary,
      product,
      dateRange: { startDate: '2026-07-01', endDate: '2026-07-31' },
    });

    expect(html).toContain('ช่วงวันที่: 2026-07-01 → 2026-07-31');
  });
});

describe('downloadGangsExcel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('downloads an .xls blob with product code in filename', () => {
    downloadGangsExcel({ rows, summary, product });

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0]!;
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe('profit-loss-gangs-R1.xls');
  });
});
