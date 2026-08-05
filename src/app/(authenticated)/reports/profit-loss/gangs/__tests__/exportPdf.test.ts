import { describe, expect, it } from 'vitest';
import { generateGangsPdfHtml } from '../exportPdf';

describe('generateGangsPdfHtml', () => {
  it('includes product, summary and gang rows', () => {
    const html = generateGangsPdfHtml({
      rows: [
        {
          gangNo: 2,
          startDate: '2026-07-01',
          endDate: null,
          soldKg: 50,
          revenue: 2500,
          cogs: 2000,
          profitLoss: 500,
          salesCount: 1,
        },
      ],
      summary: { soldKg: 50, revenue: 2500, cogs: 2000, profitLoss: 500 },
      product: { code: 'R1', name: 'ยาง' },
      printedAt: new Date('2026-07-15T10:00:00'),
    });

    expect(html).toContain('รายงานกำไร / ขาดทุนต่อกอง');
    expect(html).toContain('R1');
    expect(html).toContain('ยาง');
    expect(html).toContain('กอง 2');
    expect(html).toContain('กำลังดำเนินอยู่');
    expect(html).toContain('Net Profit');
  });
});
