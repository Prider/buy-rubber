import type { NavItem } from '@/shared/layout/Layout';

export const rubberNav: NavItem[] = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: '📊' },
  { name: 'รับซื้อยาง', href: '/purchases', icon: '🛒' },
  { name: 'ขายสินค้า', href: '/sales', icon: '🚚' },
  { name: 'สต็อกสินค้า', href: '/stock', icon: '📦' },
  { name: 'ประวัติการรับซื้อ', href: '/purchases-list', icon: '📋' },
  { name: 'สมาชิก', href: '/members', icon: '👥' },
  { name: 'บริษัทปลายทาง', href: '/destination-companies', icon: '🏢' },
  { name: 'ค่าใช้จ่าย', href: '/expenses', icon: '💰' },
  { name: 'รายงาน', href: '/reports', icon: '📈' },
  { name: 'กำไร/ขาดทุน', href: '/reports/profit-loss', icon: '📉' },
];
