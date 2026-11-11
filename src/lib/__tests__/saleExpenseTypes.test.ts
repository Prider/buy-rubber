import { describe, expect, it } from 'vitest';
import {
  findDuplicateSaleExpenseTypeName,
  mergeSaleExpenseTypeNames,
  normalizeSaleExpenseTypeName,
  saleExpenseTypeNameError,
} from '@/lib/saleExpenseTypes';

describe('sale expense type names', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeSaleExpenseTypeName('  ค่าขนส่ง   พิเศษ  ')).toBe('ค่าขนส่ง พิเศษ');
    expect(normalizeSaleExpenseTypeName(null)).toBe('');
  });

  it('rejects an empty or oversized name', () => {
    expect(saleExpenseTypeNameError('')).toBe('กรุณาระบุชื่อชนิดค่าใช้จ่าย');
    expect(saleExpenseTypeNameError('ก'.repeat(81))).toBe('ชื่อชนิดค่าใช้จ่ายยาวเกินไป');
    expect(saleExpenseTypeNameError('ค่าขนส่ง')).toBeNull();
  });

  it('matches an existing name without case sensitivity', () => {
    const types = [
      { id: '1', name: 'ค่าขนส่ง' },
      { id: '2', name: 'ภาษี' },
    ];
    expect(findDuplicateSaleExpenseTypeName(types, ' ค่าขนส่ง ')).toEqual(types[0]);
    expect(findDuplicateSaleExpenseTypeName(types, 'ค่าขนส่ง', '1')).toBeUndefined();
    expect(findDuplicateSaleExpenseTypeName(types, 'ค่าทางด่วน')).toBeUndefined();
  });

  it('keeps the default types first and skips summary labels', () => {
    expect(mergeSaleExpenseTypeNames(['  ค่าขนส่ง  ', 'ค่าทางด่วน', 'ค่าขนส่ง (+1)', null, ''])).toEqual([
      'ค่าขนส่ง',
      'ค่าแรง',
      'ค่าบริการ',
      'ภาษี',
      'อื่นๆ',
      'ค่าทางด่วน',
    ]);
  });
});
