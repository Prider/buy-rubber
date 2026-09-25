'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/shared/layout/Layout';

const TAB_HREFS = ['/dashboard', '/purchases', '/sales', '/stock'] as const;

const TAB_LABELS: Record<(typeof TAB_HREFS)[number], string> = {
  '/dashboard': 'แดชบอร์ด',
  '/purchases': 'รับซื้อ',
  '/sales': 'ขาย',
  '/stock': 'สต็อก',
};

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/reports/profit-loss') {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (href === '/reports') {
    return pathname === '/reports';
  }
  if (href === '/purchases') {
    return pathname === '/purchases' || (pathname.startsWith('/purchases/') && !pathname.startsWith('/purchases-list'));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentPageTitle(pathname: string, items: NavItem[]) {
  const match = items
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.name ?? '';
}

export default function MobileTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const tabs = TAB_HREFS.flatMap((href) => {
    const item = items.find((entry) => entry.href === href);
    return item ? [item] : [];
  });
  const moreItems = items.filter((item) => !TAB_HREFS.includes(item.href as (typeof TAB_HREFS)[number]));
  const moreActive = moreItems.some((item) => isNavItemActive(pathname, item.href));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="ปิดเมนู"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">เพิ่มเติม</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="ปิด"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="px-2 pb-3">
              {moreItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                        active
                          ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-700 dark:bg-gray-800 lg:hidden"
        aria-label="เมนูหลัก"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const label = TAB_LABELS[item.href as (typeof TAB_HREFS)[number]];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] leading-tight ${
                    active ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">{item.icon}</span>
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[11px] leading-tight ${
                moreOpen || moreActive ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-expanded={moreOpen}
              aria-label="เพิ่มเติม"
            >
              <span className="text-lg" aria-hidden="true">☰</span>
              เพิ่มเติม
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
