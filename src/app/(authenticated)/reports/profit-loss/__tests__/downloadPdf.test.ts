import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfitLossRow, ProfitLossTotals } from '../types';

const save = vi.fn();
const addImage = vi.fn();
const addPage = vi.fn();

vi.mock('jspdf', () => {
  function MockjsPDF() {
    return {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      addImage,
      addPage,
      save,
    };
  }

  return { jsPDF: MockjsPDF };
});

vi.mock('html2canvas', () => ({
  default: vi.fn(async () => ({
    width: 794,
    height: 400,
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  })),
}));

import html2canvas from 'html2canvas';
import { downloadProfitLossPdf } from '../exportPdf';

function makeRow(period: string): ProfitLossRow {
  return {
    period,
    sales: 100,
    purchases: 40,
    expenses: 10,
    purchasePricePerKg: 50,
    salePricePerKg: 60,
    net: 50,
  };
}

const totals: ProfitLossTotals = {
  sales: 100,
  purchases: 40,
  expenses: 10,
  net: 50,
};

describe('downloadProfitLossPdf', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders HTML pages and saves a PDF with the date range filename', async () => {
    const promise = downloadProfitLossPdf({
      rows: [makeRow('2026-01'), makeRow('2026-02')],
      totals,
      startDate: '2026-01-01',
      endDate: '2026-02-28',
      viewMode: 'monthly',
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(html2canvas).toHaveBeenCalled();
    expect(addImage).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith('profit-loss-2026-01-01-to-2026-02-28.pdf');
  });

  it('adds extra pages when rows span multiple PDF pages', async () => {
    const rows = Array.from({ length: 40 }, (_, i) => makeRow(`2026-${String(i + 1).padStart(2, '0')}`));

    const promise = downloadProfitLossPdf({
      rows,
      totals,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      viewMode: 'monthly',
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(addPage).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith('profit-loss-2026-01-01-to-2026-12-31.pdf');
  });
});
