import { describe, expect, it } from 'vitest';
import {
  expenseCategoryNameError,
  findDuplicateExpenseCategoryName,
  mergeExpenseCategoryNames,
  normalizeExpenseCategoryName,
} from '@/lib/expenseCategories';

describe('expense category names', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeExpenseCategoryName('  ค่าน้ำมัน   รถ  ')).toBe('ค่าน้ำมัน รถ');
    expect(normalizeExpenseCategoryName(null)).toBe('');
  });

  it('rejects an empty or oversized name', () => {
    expect(expenseCategoryNameError('')).toBe('กรุณาระบุชื่อประเภทค่าใช้จ่าย');
    expect(expenseCategoryNameError('ก'.repeat(81))).toBe('ชื่อประเภทยาวเกินไป');
    expect(expenseCategoryNameError('ค่าขนส่ง')).toBeNull();
  });

  it('matches an existing name without case sensitivity', () => {
    const categories = [
      { id: '1', name: 'ค่าน้ำมัน' },
      { id: '2', name: 'ค่าซ่อมรถ' },
    ];
    expect(findDuplicateExpenseCategoryName(categories, ' ค่าน้ำมัน ')).toEqual(categories[0]);
    expect(findDuplicateExpenseCategoryName(categories, 'ค่าน้ำมัน', '1')).toBeUndefined();
    expect(findDuplicateExpenseCategoryName(categories, 'ค่าคนงาน')).toBeUndefined();
  });

  it('keeps the default types first and appends names already used', () => {
    expect(mergeExpenseCategoryNames(['  ค่าน้ำมัน  ', 'ค่าไฟ', '', 'ค่าไฟ'])).toEqual([
      'ค่าน้ำมัน',
      'ค่าซ่อมรถ',
      'ค่าคนงาน',
      'อื่นๆ',
      'ค่าไฟ',
    ]);
  });
});
