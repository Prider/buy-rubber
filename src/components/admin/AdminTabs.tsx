'use client';

import { useEffect, useRef } from 'react';

export const ADMIN_TABS = [
  { id: 'slip', label: 'ใบรับซื้อ (Slip)' },
  { id: 'users', label: 'ผู้ใช้งาน' },
  { id: 'connection', label: 'การเชื่อมต่อ' },
  { id: 'license', label: 'ใบอนุญาตซอฟต์แวร์' },
] as const;

export type AdminSettingsTab = (typeof ADMIN_TABS)[number]['id'];

interface AdminTabsProps {
  activeTab: AdminSettingsTab;
  onTabChange: (tab: AdminSettingsTab) => void;
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    if (activeBox.left >= scrollerBox.left && activeBox.right <= scrollerBox.right) return;
    const left =
      activeBox.left - scrollerBox.left + scroller.scrollLeft - (scroller.clientWidth - activeBox.width) / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:border-b md:border-gray-200 md:px-0 md:dark:border-gray-700"
      role="tablist"
      aria-label="หมวดการตั้งค่า"
    >
      <div className="flex w-max gap-1.5 md:w-auto md:flex-wrap md:gap-1">
        {ADMIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`admin-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`admin-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium leading-4 transition-colors duration-200 md:-mb-px md:rounded-b-none md:rounded-t-lg md:border-b-2 md:px-4 md:py-2.5 md:text-sm ${
                isActive
                  ? 'bg-blue-600 text-white md:border-blue-600 md:bg-transparent md:text-blue-600 dark:md:border-blue-400 dark:md:text-blue-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:border-transparent md:bg-transparent md:text-gray-600 md:hover:bg-transparent md:hover:text-gray-900 dark:md:bg-transparent dark:md:text-gray-400 dark:md:hover:bg-transparent dark:md:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
