import { formatCurrency } from '@/lib/utils';
import type { DashboardPeriod } from '@/lib/dashboard/activity';
import type { DashboardStats } from '@/hooks/useDashboardData';

export type DashboardMetric = 'purchases' | 'sales' | 'serviceFees' | 'expenses';

/** Flip to true to show the ค่าบริการ box again. */
const SHOW_DASHBOARD_SERVICE_FEE = false;

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
  cardClass: string;
  idleClass: string;
  selectedClass: string;
}> = [
  {
    id: 'purchases',
    title: 'รับซื้อ',
    todayCount: 'todayPurchases',
    todayAmount: 'todayAmount',
    monthCount: 'monthPurchases',
    monthAmount: 'monthAmount',
    iconClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100',
    cardClass: 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950/50 dark:to-blue-950/40',
    idleClass: 'border-sky-200 hover:border-sky-300 dark:border-sky-800 dark:hover:border-sky-600',
    selectedClass: 'border-sky-500 dark:border-sky-400',
  },
  {
    id: 'sales',
    title: 'ขาย',
    todayCount: 'todaySales',
    todayAmount: 'todaySaleAmount',
    monthCount: 'monthSales',
    monthAmount: 'monthSaleAmount',
    iconClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
    cardClass: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-950/40',
    idleClass: 'border-emerald-200 hover:border-emerald-300 dark:border-emerald-800 dark:hover:border-emerald-600',
    selectedClass: 'border-emerald-500 dark:border-emerald-400',
  },
  {
    id: 'serviceFees',
    title: 'ค่าบริการ',
    todayCount: 'todayServiceFees',
    todayAmount: 'todayServiceFeeAmount',
    monthCount: 'monthServiceFees',
    monthAmount: 'monthServiceFeeAmount',
    iconClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
    cardClass: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/40',
    idleClass: 'border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-600',
    selectedClass: 'border-amber-500 dark:border-amber-400',
  },
  {
    id: 'expenses',
    title: 'ค่าใช้จ่าย',
    todayCount: 'todayExpenses',
    todayAmount: 'todayExpenseAmount',
    monthCount: 'monthExpenses',
    monthAmount: 'monthExpenseAmount',
    iconClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100',
    cardClass: 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/50 dark:to-red-950/40',
    idleClass: 'border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-600',
    selectedClass: 'border-rose-500 dark:border-rose-400',
  },
];

export default function SummaryMetricCards({ stats, period, metric, onSelect }: SummaryMetricCardsProps) {
  const metrics = METRICS.filter((item) => SHOW_DASHBOARD_SERVICE_FEE || item.id !== 'serviceFees');

  return (
    <div className={`grid shrink-0 gap-2 ${metrics.length > 3 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
      {metrics.map((item) => {
        const selected = metric === item.id;
        const count = Number(period === 'today' ? stats[item.todayCount] : stats[item.monthCount]) || 0;
        const amount = Number(period === 'today' ? stats[item.todayAmount] : stats[item.monthAmount]) || 0;
        const periodLabel = period === 'today' ? 'วันนี้' : 'เดือนนี้';

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            className={`rounded-2xl border-2 px-3 py-2 text-left shadow-sm transition-colors duration-150 ${item.cardClass} ${
              selected ? item.selectedClass : item.idleClass
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${item.iconClass}`}>
                {item.title}
              </span>
              <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                {periodLabel}
              </span>
            </div>
            <p className="mt-1 text-xl font-bold leading-tight tabular-nums tracking-tight text-gray-950 dark:text-white sm:text-2xl">
              {formatCurrency(amount)}
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums text-gray-700 dark:text-gray-200">
              ({countFormat.format(count)} รายการ)
            </p>
          </button>
        );
      })}
    </div>
  );
}
