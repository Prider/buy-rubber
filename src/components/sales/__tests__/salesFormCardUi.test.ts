import { describe, it, expect } from 'vitest';
import {
  getSalesFormCardBorderClass,
  getSalesFormCardTitle,
  getSalesFormSaveButtonText,
  getSalesFormLayoutClasses,
} from '../salesFormCardUi';

describe('salesFormCardUi', () => {
  describe('getSalesFormCardBorderClass', () => {
    it('uses violet border when editing', () => {
      expect(getSalesFormCardBorderClass(true)).toContain('violet');
    });

    it('uses neutral border when not editing', () => {
      expect(getSalesFormCardBorderClass(false)).toContain('gray');
    });
  });

  describe('getSalesFormCardTitle', () => {
    it('returns create title when not editing', () => {
      expect(getSalesFormCardTitle(false, 'SAL-001')).toBe('บันทึกการขาย');
    });

    it('includes sale number when editing', () => {
      expect(getSalesFormCardTitle(true, 'SAL-001')).toBe('แก้การขาย เลขที่ SAL-001');
    });

    it('omits sale number when editing but number missing', () => {
      expect(getSalesFormCardTitle(true, null)).toBe('แก้การขาย');
      expect(getSalesFormCardTitle(true, undefined)).toBe('แก้การขาย');
    });
  });

  describe('getSalesFormSaveButtonText', () => {
    it('shows saving state for create', () => {
      expect(getSalesFormSaveButtonText(true, false)).toBe('กำลังบันทึก...');
    });

    it('shows saving state for edit', () => {
      expect(getSalesFormSaveButtonText(true, true)).toBe('กำลังบันทึกการแก้ไข...');
    });

    it('shows labels when not saving', () => {
      expect(getSalesFormSaveButtonText(false, false)).toBe('บันทึก Selling Transactions');
      expect(getSalesFormSaveButtonText(false, true)).toBe('บันทึกการแก้ไข');
    });
  });

  describe('getSalesFormLayoutClasses', () => {
    it('returns compact-friendly padding when compact', () => {
      const c = getSalesFormLayoutClasses(true);
      expect(c.headerBtnPad).toContain('px-4');
      expect(c.rowGap).toBe('gap-2');
    });

    it('returns roomier layout when not compact', () => {
      const c = getSalesFormLayoutClasses(false);
      expect(c.headerBtnPad).toContain('px-6');
      expect(c.rowGap).toBe('gap-3');
    });
  });
});
