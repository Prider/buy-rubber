import { describe, expect, it } from 'vitest';
import {
  findDuplicateServiceFeeCategoryName,
  normalizeServiceFeeCategoryName,
  serviceFeeCategoryNameError,
} from '@/lib/serviceFeeCategories';

describe('service fee category names', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeServiceFeeCategoryName('  ค่าชั่ง   หน้าจุด  ')).toBe('ค่าชั่ง หน้าจุด');
    expect(normalizeServiceFeeCategoryName(null)).toBe('');
  });

  it('rejects an empty or oversized name', () => {
    expect(serviceFeeCategoryNameError('')).toBe('กรุณาระบุชื่อประเภทค่าบริการ');
    expect(serviceFeeCategoryNameError('ก'.repeat(81))).toBe('ชื่อประเภทยาวเกินไป');
    expect(serviceFeeCategoryNameError('ค่าขนส่ง')).toBeNull();
  });

  it('matches an existing name without case sensitivity', () => {
    const categories = [
      { id: '1', name: 'ค่าชั่ง' },
      { id: '2', name: 'ค่าขนส่ง' },
    ];
    expect(findDuplicateServiceFeeCategoryName(categories, ' ค่าชั่ง ')).toEqual(categories[0]);
    expect(findDuplicateServiceFeeCategoryName(categories, 'ค่าชั่ง', '1')).toBeUndefined();
    expect(findDuplicateServiceFeeCategoryName(categories, 'ค่าแรง')).toBeUndefined();
  });
});
