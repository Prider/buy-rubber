import { describe, expect, it } from 'vitest';
import {
  computePagination,
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
      expenseType: '',
      expenseCost: '',
      expenseNote: '',
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
});
