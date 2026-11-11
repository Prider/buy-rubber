import { describe, expect, it } from 'vitest';
import {
  findDuplicateSellingTypeName,
  mergeSellingTypeNames,
  normalizeSellingTypeName,
  sellingTypeNameError,
} from '@/lib/sellingTypes';

describe('selling type names', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeSellingTypeName('  จ่ายสด   พิเศษ  ')).toBe('จ่ายสด พิเศษ');
    expect(normalizeSellingTypeName(null)).toBe('');
  });

  it('rejects an empty or oversized name', () => {
    expect(sellingTypeNameError('')).toBe('กรุณาระบุชื่อรูปแบบการขาย');
    expect(sellingTypeNameError('ก'.repeat(81))).toBe('ชื่อรูปแบบการขายยาวเกินไป');
    expect(sellingTypeNameError('จ่ายสด')).toBeNull();
  });

  it('matches an existing name without case sensitivity', () => {
    const types = [
      { id: '1', name: 'จ่ายสด' },
      { id: '2', name: 'ฝาก' },
    ];
    expect(findDuplicateSellingTypeName(types, ' จ่ายสด ')).toEqual(types[0]);
    expect(findDuplicateSellingTypeName(types, 'จ่ายสด', '1')).toBeUndefined();
    expect(findDuplicateSellingTypeName(types, 'ขายเชื่อ')).toBeUndefined();
  });

  it('keeps the default types first and appends names already used', () => {
    expect(mergeSellingTypeNames(['  จ่ายสด  ', 'ขายเชื่อ', '', 'ขายเชื่อ'])).toEqual([
      'จ่ายสด',
      'ขายล่วง',
      'ฝาก',
      'ขายเชื่อ',
    ]);
  });
});
