import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSalesPageController } from '../useSalesPageController';

const mockPush = vi.fn();
const mockShowConfirm = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'tester', role: 'USER' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({
    showConfirm: mockShowConfirm,
    showAlert: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}));

function mockSale(id: string) {
  return {
    id,
    saleNo: `SAL-${id}`,
    date: '2026-07-01T00:00:00.000Z',
    companyName: 'บริษัท ทดสอบ',
    productTypeId: 'pt-1',
    productType: { code: 'R1', name: 'ยาง' },
    weight: 100,
    rubberPercent: 60,
    pricePerUnit: 45,
    expenseType: null,
    expenseCost: null,
    sellingType: 'จ่ายสด',
    totalAmount: 4500,
    notes: null,
  };
}

describe('useSalesPageController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/stock/positions')) {
        return {
          ok: true,
          json: async () => [{ productTypeId: 'pt-1', quantityKg: 1000, avgCostPerKg: 40 }],
        } as Response;
      }

      if (url.includes('/api/product-types')) {
        return {
          ok: true,
          json: async () => [{ id: 'pt-1', code: 'R1', name: 'ยาง' }],
        } as Response;
      }

      if (url.includes('/api/sales')) {
        const parsed = new URL(url, 'http://localhost');
        const page = Number(parsed.searchParams.get('page') || '1');
        const limit = Number(parsed.searchParams.get('limit') || '10');
        const search = parsed.searchParams.get('search') ?? '';

        return {
          ok: true,
          json: async () => ({
            data: [mockSale(String(page))],
            pagination: {
              page,
              limit,
              total: search ? 1 : 100_000,
              totalPages: search ? 1 : 10_000,
            },
          }),
        } as Response;
      }

      return { ok: false, json: async () => ({}) } as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches sales with page and limit instead of loading all rows', async () => {
    const { result } = renderHook(() => useSalesPageController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const salesCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes('/api/sales'));

    expect(salesCalls.length).toBeGreaterThan(0);
    expect(salesCalls[0]).toContain('page=1');
    expect(salesCalls[0]).toContain('limit=10');
    expect(result.current.paginatedSales).toHaveLength(1);
    expect(result.current.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 100_000,
      totalPages: 10_000,
    });
  });

  it('refetches the requested page when currentPage changes', async () => {
    const salesUrls: string[] = [];
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/sales')) salesUrls.push(url);

      if (url.includes('/api/stock/positions')) {
        return {
          ok: true,
          json: async () => [{ productTypeId: 'pt-1', quantityKg: 1000, avgCostPerKg: 40 }],
        } as Response;
      }
      if (url.includes('/api/product-types')) {
        return {
          ok: true,
          json: async () => [{ id: 'pt-1', code: 'R1', name: 'ยาง' }],
        } as Response;
      }
      if (url.includes('/api/sales')) {
        const parsed = new URL(url, 'http://localhost');
        const page = Number(parsed.searchParams.get('page') || '1');
        return {
          ok: true,
          json: async () => ({
            data: [mockSale(String(page))],
            pagination: { page, limit: 10, total: 100_000, totalPages: 10_000 },
          }),
        } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    });

    const { result } = renderHook(() => useSalesPageController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    salesUrls.length = 0;

    act(() => {
      result.current.setCurrentPage(4);
    });

    await waitFor(() => {
      expect(salesUrls.some((url) => url.includes('page=4') && url.includes('limit=10'))).toBe(true);
    });
  });

  it('includes search in the sales request', async () => {
    const salesUrls: string[] = [];
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/sales')) salesUrls.push(url);

      if (url.includes('/api/stock/positions')) {
        return {
          ok: true,
          json: async () => [{ productTypeId: 'pt-1', quantityKg: 1000, avgCostPerKg: 40 }],
        } as Response;
      }
      if (url.includes('/api/product-types')) {
        return {
          ok: true,
          json: async () => [{ id: 'pt-1', code: 'R1', name: 'ยาง' }],
        } as Response;
      }
      if (url.includes('/api/sales')) {
        const parsed = new URL(url, 'http://localhost');
        const page = Number(parsed.searchParams.get('page') || '1');
        return {
          ok: true,
          json: async () => ({
            data: [mockSale(String(page))],
            pagination: { page, limit: 10, total: 1, totalPages: 1 },
          }),
        } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    });

    const { result } = renderHook(() => useSalesPageController());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    salesUrls.length = 0;

    act(() => {
      result.current.handleSearchChange({
        target: { value: 'ยางไทย' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => {
      expect(salesUrls.some((url) => url.includes('search='))).toBe(true);
    });
  });
});
