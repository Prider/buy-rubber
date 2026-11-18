import { describe, expect, it } from 'vitest';
import {
  isMobileNavActive,
  mobilePageTitle,
  mobileShortLabel,
  splitMobileNav,
} from '@/lib/mobileNav';

const adminHrefs = [
  '/dashboard',
  '/stock',
  '/purchases',
  '/sales',
  '/members',
  '/destination-companies',
  '/expenses',
  '/reports',
  '/guide',
];

describe('splitMobileNav', () => {
  it('keeps the four daily pages as tabs and the rest in the sheet', () => {
    expect(splitMobileNav(adminHrefs)).toEqual({
      tabs: ['/dashboard', '/stock', '/purchases', '/sales'],
      sheet: ['/members', '/destination-companies', '/expenses', '/reports', '/guide'],
    });
  });

  it('drops tabs a role cannot open', () => {
    expect(splitMobileNav(['/stock', '/purchases', '/sales', '/members', '/expenses', '/guide'])).toEqual({
      tabs: ['/stock', '/purchases', '/sales'],
      sheet: ['/members', '/expenses', '/guide'],
    });
  });

  it('uses the remaining pages as tabs when none of the daily pages are available', () => {
    expect(splitMobileNav(['/reports', '/guide'])).toEqual({
      tabs: ['/reports', '/guide'],
      sheet: [],
    });
  });
});

describe('mobile labels', () => {
  it('shortens the daily tab labels', () => {
    expect(mobileShortLabel('/dashboard', 'แดชบอร์ด')).toBe('หน้าหลัก');
    expect(mobileShortLabel('/sales', 'ขายสินค้า')).toBe('ขาย');
    expect(mobileShortLabel('/members', 'สมาชิก')).toBe('สมาชิก');
  });

  it('names the current page for the phone title', () => {
    expect(mobilePageTitle('/dashboard')).toBe('แดชบอร์ด');
    expect(mobilePageTitle('/stock/rubber')).toBe('สต็อกสินค้า');
    expect(mobilePageTitle('/purchases-list')).toBe('ประวัติการรับซื้อ');
    expect(mobilePageTitle('/reports/profit-loss')).toBe('รายงาน');
    expect(mobilePageTitle('/unknown')).toBe('Yang Dee');
  });

  it('treats nested routes as the parent tab', () => {
    expect(isMobileNavActive('/stock/rubber', '/stock')).toBe(true);
    expect(isMobileNavActive('/reports/profit-loss', '/reports')).toBe(true);
    expect(isMobileNavActive('/purchases-list', '/purchases')).toBe(false);
  });
});
