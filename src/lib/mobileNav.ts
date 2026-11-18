/** Daily destinations that earn a phone tab. Everything else goes in the sheet. */
export const MOBILE_PRIMARY_HREFS = ['/dashboard', '/stock', '/purchases', '/sales'] as const;

const SHORT_LABELS: Record<string, string> = {
  '/dashboard': 'หน้าหลัก',
  '/stock': 'สต็อก',
  '/purchases': 'รับซื้อ',
  '/sales': 'ขาย',
  '/reports': 'รายงาน',
  '/guide': 'คู่มือ',
};

const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: '/dashboard', title: 'แดชบอร์ด' },
  { prefix: '/stock', title: 'สต็อกสินค้า' },
  { prefix: '/purchases-list', title: 'ประวัติการรับซื้อ' },
  { prefix: '/purchases', title: 'รับซื้อ' },
  { prefix: '/sales', title: 'ขายสินค้า' },
  { prefix: '/members', title: 'สมาชิก' },
  { prefix: '/destination-companies', title: 'บริษัทปลายทาง' },
  { prefix: '/expenses', title: 'ค่าใช้จ่าย' },
  { prefix: '/reports', title: 'รายงาน' },
  { prefix: '/guide', title: 'คู่มือ' },
  { prefix: '/admin', title: 'ตั้งค่าระบบ' },
  { prefix: '/backup', title: 'สำรองข้อมูล' },
];

export function splitMobileNav(hrefs: string[]): { tabs: string[]; sheet: string[] } {
  const primary = MOBILE_PRIMARY_HREFS.filter((href) => hrefs.includes(href));
  if (primary.length > 0) {
    const tabSet = new Set<string>(primary);
    return {
      tabs: [...primary],
      sheet: hrefs.filter((href) => !tabSet.has(href)),
    };
  }
  return { tabs: [...hrefs], sheet: [] };
}

export function mobileShortLabel(href: string, name: string): string {
  return SHORT_LABELS[href] ?? name;
}

export function isMobileNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function mobilePageTitle(pathname: string): string {
  const match = PAGE_TITLES.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  );
  return match?.title ?? 'Yang Dee';
}
