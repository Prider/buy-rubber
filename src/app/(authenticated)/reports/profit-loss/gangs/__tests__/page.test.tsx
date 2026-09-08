import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DATE_FILTER_GANG_FIXTURES } from '@/app/api/stock/gangs/__tests__/dateFilterFixtures';
import { gangOverlapsRange, parseGangDateRange } from '@/app/api/stock/gangs/dateRange';
import { toInputDate } from '../../utils';

const { axiosGet, mockRouter, mockUser } = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  },
  mockUser: { id: '1', username: 'admin', role: 'admin', isActive: true },
}));

vi.mock('axios', () => ({
  default: {
    get: axiosGet,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/reports/profit-loss/gangs',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/components/GamerLoader', () => ({
  default: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock('../exportPdf', () => ({
  downloadGangsPdf: vi.fn(async () => undefined),
}));

vi.mock('../exportExcel', () => ({
  downloadGangsExcel: vi.fn(),
}));

import ProfitLossGangsReportPage from '../page';

function toPageRow(gang: (typeof DATE_FILTER_GANG_FIXTURES)[number]) {
  const revenue = Object.values(gang.saleAmounts).reduce((sum, amount) => sum + amount, 0);
  return {
    gangNo: gang.gangNo,
    startDate: gang.startDate.toISOString(),
    endDate: gang.endDate ? gang.endDate.toISOString() : null,
    soldKg: gang.soldKg,
    revenue,
    cogs: gang.cogs,
    profitLoss: revenue - gang.cogs,
    salesCount: gang.salesCount,
  };
}

function gangsForRange(startDate: string, endDate: string) {
  const parsed = parseGangDateRange(startDate, endDate);
  if (!parsed.ok) return [];
  return DATE_FILTER_GANG_FIXTURES.filter((gang) => gangOverlapsRange(gang, parsed)).map(toPageRow);
}

async function renderLoadedPage() {
  render(<ProfitLossGangsReportPage />);
  expect(await screen.findByRole('heading', { name: 'กำไร / ขาดทุนต่อกอง' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'อัปเดตรายงาน' })).toBeEnabled();
}

describe('ProfitLossGangsReportPage date filters', () => {
  const defaultStart = toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const defaultEnd = toInputDate(new Date());

  beforeEach(() => {
    axiosGet.mockReset();
    axiosGet.mockImplementation(async (url: string, config?: { params?: Record<string, string> }) => {
      if (url === '/api/product-types') {
        return {
          data: [
            { id: 'pt-1', code: 'R1', name: 'ยางแผ่น' },
            { id: 'pt-2', code: 'R2', name: 'น้ำยางสด' },
          ],
        };
      }
      if (url === '/api/stock/gangs') {
        const startDate = config?.params?.startDate || defaultStart;
        const endDate = config?.params?.endDate || defaultEnd;
        const rows = gangsForRange(startDate, endDate);
        return {
          data: {
            data: rows,
            pagination: { page: 1, limit: 15, total: rows.length, totalPages: 1 },
          },
        };
      }
      throw new Error(`unexpected url ${url}`);
    });
  });

  it('loads gangs with the same default start/end dates as the profit-loss report', async () => {
    await renderLoadedPage();

    expect(screen.getByLabelText('วันที่เริ่มต้น')).toHaveValue(defaultStart);
    expect(screen.getByLabelText('วันที่สิ้นสุด')).toHaveValue(defaultEnd);

    await waitFor(() => {
      expect(axiosGet).toHaveBeenCalledWith(
        '/api/stock/gangs',
        expect.objectContaining({
          params: expect.objectContaining({
            productTypeId: 'pt-1',
            startDate: defaultStart,
            endDate: defaultEnd,
          }),
        }),
      );
    });
  });

  it('shows July gangs when the date range is July, including straddle cycles', async () => {
    await renderLoadedPage();

    fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('วันที่สิ้นสุด'), { target: { value: '2026-07-31' } });

    expect(await screen.findByText('กอง 8')).toBeInTheDocument();
    expect(screen.getByText('กอง 7')).toBeInTheDocument();
    expect(screen.getByText('กอง 9')).toBeInTheDocument();
    expect(screen.queryByText('กอง 1')).not.toBeInTheDocument();
    expect(screen.queryByText('กอง 12')).not.toBeInTheDocument();
    expect(screen.getByText('3 กอง')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosGet).toHaveBeenCalledWith(
        '/api/stock/gangs',
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: '2026-07-01',
            endDate: '2026-07-31',
          }),
        }),
      );
    });
  });

  it('shows the open September gang when filtering the current-month-style window', async () => {
    await renderLoadedPage();

    fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('วันที่สิ้นสุด'), { target: { value: '2026-09-08' } });

    expect(await screen.findByText('กอง 12')).toBeInTheDocument();
    expect(screen.getByText('กำลังดำเนินอยู่')).toBeInTheDocument();
    expect(screen.getByText('กอง 11')).toBeInTheDocument();
    expect(screen.queryByText('กอง 8')).not.toBeInTheDocument();
    expect(screen.getByText('2 กอง')).toBeInTheDocument();
  });

  it('shows Q2 gangs (Apr–Jun) and hides later cycles', async () => {
    await renderLoadedPage();

    fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น'), { target: { value: '2026-04-01' } });
    fireEvent.change(screen.getByLabelText('วันที่สิ้นสุด'), { target: { value: '2026-06-30' } });

    expect(await screen.findByText('กอง 4')).toBeInTheDocument();
    expect(screen.getByText('กอง 5')).toBeInTheDocument();
    expect(screen.getByText('กอง 6')).toBeInTheDocument();
    expect(screen.getByText('กอง 7')).toBeInTheDocument();
    expect(screen.queryByText('กอง 8')).not.toBeInTheDocument();
    expect(screen.getByText('4 กอง')).toBeInTheDocument();
  });

  it('shows a validation message when startDate is after endDate', async () => {
    await renderLoadedPage();

    fireEvent.change(screen.getByLabelText('วันที่เริ่มต้น'), { target: { value: '2026-07-31' } });
    fireEvent.change(screen.getByLabelText('วันที่สิ้นสุด'), { target: { value: '2026-07-01' } });

    expect(await screen.findByText('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด')).toBeInTheDocument();
    const updateButton = await screen.findByRole('button', { name: 'อัปเดตรายงาน' });
    expect(updateButton).toBeDisabled();
    expect(updateButton).toHaveAttribute('aria-disabled', 'true');
  });
});
