'use client';

import { PurchaseSummary } from '@/types/memberHistory';
import { formatCurrency, formatNumber } from '@/lib/utils';

type SummaryIconType = 'currency' | 'clipboard' | 'weight';

interface SummaryCardProps {
  title: string;
  icon: SummaryIconType;
  bg: string;
  value: string;
  subText: string;
}

const SummaryIcon = ({ type }: { type: SummaryIconType }) => {
  switch (type) {
    case 'currency':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'clipboard':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
      );
  }
};

export const SummaryCard = ({ title, icon, bg, value, subText }: SummaryCardProps) => (
  <div className={`rounded-lg border px-3 py-2 ${bg}`}>
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs font-medium">{title}</div>
      <SummaryIcon type={icon} />
    </div>
    <div className="mt-0.5 text-lg font-bold leading-tight tabular-nums">{value}</div>
    <div className="text-[11px] leading-4 opacity-80">{subText}</div>
  </div>
);

export const SUMMARY_CARD_CONFIG = [
  {
    title: 'ยอดรวมทั้งหมด',
    icon: 'currency' as SummaryIconType,
    bg: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100',
    formatter: (summary: PurchaseSummary) => formatCurrency(summary.totalAmount),
    subText: (summary: PurchaseSummary) => `${summary.totalPurchases} รายการ`,
  },
  {
    title: 'จำนวนครั้ง',
    icon: 'clipboard' as SummaryIconType,
    bg: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100',
    formatter: (summary: PurchaseSummary) => formatNumber(summary.totalPurchases),
    subText: () => 'รายการรับซื้อ',
  },
  {
    title: 'น้ำหนักรวม',
    icon: 'weight' as SummaryIconType,
    bg: 'border-purple-200 bg-purple-50 text-purple-950 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-100',
    formatter: (summary: PurchaseSummary) => `${formatNumber(summary.totalWeight)} กก.`,
    subText: (summary: PurchaseSummary) => `ราคาเฉลี่ย ${formatNumber(summary.avgPrice)} บ./กก.`,
  },
];

