'use client';

export const REPORT_TABS = [
  { id: 'daily_purchase', label: 'รับซื้อประจำวัน' },
  { id: 'sell_summary', label: 'สรุปการขาย' },
  { id: 'member_summary', label: 'สรุปรายสมาชิก' },
  { id: 'expense_summary', label: 'ค่าใช้จ่าย' },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]['id'];

interface ReportTabsProps {
  activeTab: ReportTabId;
  onTabChange: (tab: ReportTabId) => void;
}

export default function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700"
      role="tablist"
      aria-label="ประเภทรายงาน"
    >
      {REPORT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`report-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls="report-tabpanel"
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
