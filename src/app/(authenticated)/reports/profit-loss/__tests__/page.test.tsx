import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/GamerLoader', () => ({
  default: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock('../ProfitLossChart', () => ({
  ProfitLossChart: () => <div data-testid="profit-loss-chart" />,
}));

vi.mock('../exportPdf', () => ({
  downloadProfitLossPdf: vi.fn(async () => undefined),
}));

vi.mock('../exportExcel', () => ({
  downloadProfitLossExcel: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { downloadProfitLossExcel } from '../exportExcel';
import { downloadProfitLossPdf } from '../exportPdf';
import ProfitLossReportPage from '../page';

describe('ProfitLossReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'admin@example.com' },
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    vi.mocked(axios.get).mockResolvedValue({
      data: {
        periods: [
          {
            period: '2026-07',
            sales: 1000,
            purchases: 400,
            expenses: 100,
            purchasePricePerKg: 50,
            salePricePerKg: 60,
            net: 500,
          },
        ],
        totals: {
          sales: 1000,
          purchases: 400,
          expenses: 100,
          net: 500,
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loader while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as ReturnType<typeof useAuth>);

    render(<ProfitLossReportPage />);
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
  });

  it('loads report data and renders summary + table', async () => {
    render(<ProfitLossReportPage />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/reports/profit-loss', expect.any(Object));
    });

    expect(await screen.findByText(/Profit:/)).toBeInTheDocument();
    expect(screen.getByTestId('profit-loss-chart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Export Excel' })).toBeEnabled();
    expect(screen.getAllByRole('link', { name: 'ดูต่อกองตามสินค้า' }).length).toBeGreaterThan(0);
  });

  it('calls downloadProfitLossPdf when Export PDF is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfitLossReportPage />);

    const pdfButton = await screen.findByRole('button', { name: 'Export PDF' });
    await waitFor(() => expect(pdfButton).toBeEnabled());

    await user.click(pdfButton);

    await waitFor(() => {
      expect(downloadProfitLossPdf).toHaveBeenCalledTimes(1);
    });
  });

  it('calls downloadProfitLossExcel when Export Excel is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfitLossReportPage />);

    const excelButton = await screen.findByRole('button', { name: 'Export Excel' });
    await waitFor(() => expect(excelButton).toBeEnabled());

    await user.click(excelButton);

    await waitFor(() => {
      expect(downloadProfitLossExcel).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error message when the report request fails', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('network'));

    render(<ProfitLossReportPage />);

    expect(await screen.findByText('ไม่สามารถโหลดรายงานกำไร/ขาดทุนได้')).toBeInTheDocument();
  });
});
