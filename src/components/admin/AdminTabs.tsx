'use client';

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
  return (
    <div
      className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700"
      role="tablist"
      aria-label="หมวดการตั้งค่า"
    >
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
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors duration-200 ${
              isActive
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
