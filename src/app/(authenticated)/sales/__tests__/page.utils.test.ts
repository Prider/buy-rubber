import { describe, expect, it } from 'vitest';
import {
  buildSalePayload,
  computePagination,
  computeTotalPreview,
  expensesFromSaleRow,
  formatExpenseTypeLabel,
  getVisiblePageNumbers,
  isSalesFormSubmitReady,
  normalizeSaleRow,
  parseRequiredNumber,
} from '../page.utils';

describe('sales page.utils pagination', () => {
  describe('computePagination', () => {
    it('computes totals for a large dataset', () => {
      expect(computePagination(100_000, 1, 10)).toEqual({
        page: 1,
        limit: 10,
        total: 100_000,
        totalPages: 10_000,
        hasMore: true,
      });
    });

    it('marks last page as no more', () => {
      expect(computePagination(100_000, 10_000, 10).hasMore).toBe(false);
    });

    it('returns at least one page when total is zero', () => {
      expect(computePagination(0, 1, 10)).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasMore: false,
      });
    });
  });

  describe('getVisiblePageNumbers', () => {
    it('returns a small window for 10,000 pages instead of every page', () => {
      const pages = getVisiblePageNumbers(5000, 10_000);
      expect(pages).toEqual([1, 'ellipsis', 4999, 5000, 5001, 'ellipsis', 10_000]);
      expect(pages.filter((p) => typeof p === 'number')).toHaveLength(5);
    });

    it('omits leading ellipsis near the start', () => {
      expect(getVisiblePageNumbers(1, 10_000)).toEqual([1, 2, 'ellipsis', 10_000]);
    });

    it('omits trailing ellipsis near the end', () => {
      expect(getVisiblePageNumbers(10_000, 10_000)).toEqual([1, 'ellipsis', 9999, 10_000]);
    });

    it('lists all pages when few exist', () => {
      expect(getVisiblePageNumbers(2, 3)).toEqual([1, 2, 3]);
    });

    it('returns empty when there are no pages', () => {
      expect(getVisiblePageNumbers(1, 0)).toEqual([]);
    });
  });

  describe('parseRequiredNumber', () => {
    it('accepts zero as a valid value', () => {
      expect(parseRequiredNumber('0')).toBe(0);
    });
  });

  describe('isSalesFormSubmitReady', () => {
    const base = {
      date: '2026-07-20',
      destinationCompanyId: 'dc-1',
      companyName: 'บริษัท A',
      productTypeId: 'pt-1',
      weight: '100',
      rubberPercent: '',
      pricePerUnit: '50',
      expenses: [] as Array<{ id: string; type: string; amount: string; note: string }>,
      sellingType: 'จ่ายสด',
    };

    it('is ready when pricePerUnit is 0', () => {
      expect(isSalesFormSubmitReady({ ...base, pricePerUnit: '0' })).toBe(true);
    });

    it('is not ready when pricePerUnit is empty', () => {
      expect(isSalesFormSubmitReady({ ...base, pricePerUnit: '' })).toBe(false);
    });

    it('is not ready when pricePerUnit is negative', () => {
      expect(isSalesFormSubmitReady({ ...base, pricePerUnit: '-1' })).toBe(false);
    });

    it('is not ready when destination company is missing', () => {
      expect(isSalesFormSubmitReady({ ...base, destinationCompanyId: '' })).toBe(false);
    });

    it('is not ready when expense has amount but no type', () => {
      expect(
        isSalesFormSubmitReady({
          ...base,
          expenses: [{ id: '1', type: '', amount: '100', note: '' }],
        }),
      ).toBe(false);
    });

    it('is ready with multiple valid expenses', () => {
      expect(
        isSalesFormSubmitReady({
          ...base,
          expenses: [
            { id: '1', type: 'ค่าขนส่ง', amount: '100', note: '' },
            { id: '2', type: 'ค่าแรง', amount: '50', note: 'note' },
          ],
        }),
      ).toBe(true);
    });
  });

  describe('computeTotalPreview / buildSalePayload', () => {
    it('sums multiple expense lines in total preview', () => {
      const formData = {
        date: '2026-07-20',
        destinationCompanyId: 'dc-1',
        companyName: 'บริษัท A',
        productTypeId: 'pt-1',
        weight: '100',
        rubberPercent: '',
        pricePerUnit: '50',
        expenses: [
          { id: '1', type: 'ค่าขนส่ง', amount: '200', note: 'a' },
          { id: '2', type: 'ค่าแรง', amount: '300', note: 'b' },
        ],
        sellingType: 'จ่ายสด',
      };
      expect(computeTotalPreview(formData)).toBe(4500); // 5000 - 500
      const payload = buildSalePayload(formData);
      expect(payload.expenseCost).toBe(500);
      expect(payload.expenseType).toBe('ค่าขนส่ง (+1)');
      expect(payload.expenses).toHaveLength(2);
      expect(payload.notes).toBe('a; b');
    });
  });

  describe('normalizeSaleRow', () => {
    it('maps notes to expenseNote', () => {
      expect(
        normalizeSaleRow({
          id: '1',
          saleNo: 'SAL-1',
          date: '2026-01-01',
          companyName: 'Co',
          productTypeId: 'pt',
          weight: 10,
          rubberPercent: null,
          pricePerUnit: 40,
          expenseType: null,
          expenseCost: null,
          sellingType: 'จ่ายสด',
          totalAmount: 400,
          notes: 'note',
        }).expenseNote,
      ).toBe('note');
    });
  });

  describe('formatExpenseTypeLabel', () => {
    it('shows first type with count when multiple expense lines', () => {
      expect(
        formatExpenseTypeLabel('หลายรายการ', [
          { id: '1', type: 'ค่าขนส่ง', amount: 100, note: null, sortOrder: 0 },
          { id: '2', type: 'ค่าแรง', amount: 50, note: null, sortOrder: 1 },
        ]),
      ).toBe('ค่าขนส่ง (+1)');
    });

    it('falls back to expenseType when no lines', () => {
      expect(formatExpenseTypeLabel('ค่าขนส่ง', [])).toBe('ค่าขนส่ง');
      expect(formatExpenseTypeLabel(null, null)).toBe('-');
    });
  });

  describe('expensesFromSaleRow', () => {
    it('maps API expense lines', () => {
      const lines = expensesFromSaleRow({
        id: '1',
        saleNo: 'SAL-1',
        date: '2026-01-01',
        companyName: 'Co',
        productTypeId: 'pt',
        weight: 10,
        rubberPercent: null,
        pricePerUnit: 40,
        expenseType: 'หลายรายการ',
        expenseCost: 150,
        sellingType: 'จ่ายสด',
        totalAmount: 250,
        expenseNote: null,
        expenses: [
          { id: 'e1', type: 'ค่าขนส่ง', amount: 100, note: 'a', sortOrder: 0 },
          { id: 'e2', type: 'ค่าแรง', amount: 50, note: null, sortOrder: 1 },
        ],
      });
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatchObject({ id: 'e1', type: 'ค่าขนส่ง', amount: '100', note: 'a' });
    });

    it('falls back to legacy single fields', () => {
      const lines = expensesFromSaleRow({
        id: '1',
        saleNo: 'SAL-1',
        date: '2026-01-01',
        companyName: 'Co',
        productTypeId: 'pt',
        weight: 10,
        rubberPercent: null,
        pricePerUnit: 40,
        expenseType: 'ค่าขนส่ง',
        expenseCost: 200,
        sellingType: 'จ่ายสด',
        totalAmount: 200,
        expenseNote: 'เก่า',
      });
      expect(lines).toEqual([
        { id: 'legacy-1', type: 'ค่าขนส่ง', amount: '200', note: 'เก่า' },
      ]);
    });
  });
});
