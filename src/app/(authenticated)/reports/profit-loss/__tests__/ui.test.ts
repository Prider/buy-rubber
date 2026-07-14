import { describe, expect, it } from 'vitest';
import {
  getExportExcelButtonText,
  getExportPdfButtonText,
  getNetResultLabel,
  isExportDisabled,
} from '../ui';

describe('profit-loss ui helpers', () => {
  describe('getExportPdfButtonText', () => {
    it('shows idle label by default', () => {
      expect(getExportPdfButtonText(false)).toBe('Export PDF');
    });

    it('shows busy label while exporting', () => {
      expect(getExportPdfButtonText(true)).toBe('กำลังสร้าง PDF...');
    });
  });

  describe('getExportExcelButtonText', () => {
    it('shows idle label by default', () => {
      expect(getExportExcelButtonText(false)).toBe('Export Excel');
    });

    it('shows busy label while exporting', () => {
      expect(getExportExcelButtonText(true)).toBe('กำลังสร้าง Excel...');
    });
  });

  describe('isExportDisabled', () => {
    it('disables when there are no rows', () => {
      expect(isExportDisabled({ hasRows: false, loading: false, exportBusy: false })).toBe(true);
    });

    it('disables while loading report data', () => {
      expect(isExportDisabled({ hasRows: true, loading: true, exportBusy: false })).toBe(true);
    });

    it('disables while an export is in progress', () => {
      expect(isExportDisabled({ hasRows: true, loading: false, exportBusy: true })).toBe(true);
    });

    it('enables when rows exist and nothing is busy', () => {
      expect(isExportDisabled({ hasRows: true, loading: false, exportBusy: false })).toBe(false);
    });
  });

  describe('getNetResultLabel', () => {
    it('returns Profit for zero or positive net', () => {
      expect(getNetResultLabel(0)).toBe('Profit');
      expect(getNetResultLabel(120)).toBe('Profit');
    });

    it('returns Loss for negative net', () => {
      expect(getNetResultLabel(-1)).toBe('Loss');
    });
  });
});
