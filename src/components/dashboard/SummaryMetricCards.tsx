import { formatCurrency } from '@/lib/utils';
import type { DashboardPeriod } from '@/lib/dashboard/activity';
import type { DashboardStats } from '@/hooks/useDashboardData';

export type DashboardMetric = 'purchases' | 'sales' | 'serviceFees' | 'expenses';

interface SummaryMetricCardsProps {
  stats: DashboardStats;
  period: DashboardPeriod;
  metric: DashboardMetric;
  onSelect: (metric: DashboardMetric) => void;
}

const countFormat = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

const METRICS: Array<{
  id: DashboardMetric;
  title: string;
  todayCount: keyof DashboardStats;
  todayAmount: keyof DashboardStats;
  monthCount: keyof DashboardStats;
  monthAmount: keyof DashboardStats;
  iconClass: string;
}> = [
  {
    id: 'purchases',
    title: 'รับซื้อ',
    todayCount: 'todayPurchases',
    todayAmount: 'todayAmount',
    monthCount: 'monthPurchases',
    monthAmount: 'monthAmount',
    iconClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100',
  },
  {
    id: 'sales',
    title: 'ขาย',
    todayCount: 'todaySales',
    todayAmount: 'todaySaleAmount',
    monthCount: 'monthSales',
    monthAmount: 'monthSaleAmount',
    iconClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
  },
  {
    id: 'serviceFees',
    title: 'ค่าบริการ',
    todayCount: 'todayServiceFees',
    todayAmount: 'todayServiceFeeAmount',
    monthCount: 'monthServiceFees',
    monthAmount: 'monthServiceFeeAmount',
    iconClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  },
  {
    id: 'expenses',
    title: 'ค่าใช้จ่าย',
    todayCount: 'todayExpenses',
    todayAmount: 'todayExpenseAmount',
    monthCount: 'monthExpenses',
    monthAmount: 'monthExpenseAmount',
    iconClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100',
  },
];

export default function SummaryMetricCards({ stats, period, metric, onSelect }: SummaryMetricCardsProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
      {METRICS.map((item) => {
        const selected = metric === item.id;
        const count = Number(period === 'today' ? stats[item.todayCount] : stats[item.monthCount]) || 0;
        const amount = Number(period === 'today' ? stats[item.todayAmount] : stats[item.monthAmount]) || 0;
        const secondaryAmount = Number(period === 'today' ? stats[item.monthAmount] : stats[item.todayAmount]) || 0;
        const secondaryLabel = period === 'today' ? 'เดือนนี้' : 'วันนี้';

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            className={`rounded-2xl border-2 px-3 py-2 text-left shadow-sm transition-colors duration-150 ${
              selected
                ? 'border-transparent [background:linear-gradient(var(--tone-surface-hex),var(--tone-surface-hex))_padding-box,linear-gradient(to_right,#3b82f6,#4f46e5)_border-box] dark:[background:linear-gradient(var(--tone-panel-hex),var(--tone-panel-hex))_padding-box,linear-gradient(to_right,#2563eb,#4338ca)_border-box]'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${item.iconClass}`}>
                {item.title}
              </span>
              <span className="truncate text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
                {secondaryLabel} {formatCurrency(secondaryAmount)}
              </span>
            </div>
            <p className="mt-1 text-4xl font-bold leading-none tabular-nums tracking-tight text-gray-950 dark:text-white">
              {countFormat.format(count)}
            </p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">
              {formatCurrency(amount)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
