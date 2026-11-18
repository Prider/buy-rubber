import { formatCurrency } from '@/lib/utils';
import type { DashboardPeriod } from '@/lib/dashboard/activity';
import type { DashboardStats } from '@/hooks/useDashboardData';

export type DashboardMetric = 'purchases' | 'sales' | 'expenses';

interface SummaryMetricCardsProps {
  stats: DashboardStats;
  period: DashboardPeriod;
  /** `null` leaves every card unpressed so a product-type chip can hold the only focus. */
  metric: DashboardMetric | null;
  onSelect: (metric: DashboardMetric) => void;
}

const countFormat = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

/** Em width per glyph, with slack so tabular figures stay inside a narrow card. */
const CURRENCY_EM = 0.62;
const COUNT_EM = 0.58;

function fittedSize(length: number, emPerChar: number, max: string) {
  const chars = Math.max(length, 1);
  return `clamp(0.5rem, calc(100cqi / ${chars * emPerChar}), ${max})`;
}

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
  return (
    <div className="grid min-w-0 shrink-0 grid-cols-3 gap-1.5 sm:gap-2">
      {METRICS.map((item) => {
        const selected = metric === item.id;
        const count = Number(period === 'today' ? stats[item.todayCount] : stats[item.monthCount]) || 0;
        const amount = Number(period === 'today' ? stats[item.todayAmount] : stats[item.monthAmount]) || 0;
        const periodLabel = period === 'today' ? 'วันนี้' : 'เดือนนี้';
        const amountLabel = formatCurrency(amount);
        const countLabel = `(${countFormat.format(count)} รายการ)`;

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(item.id)}
            className={`min-w-0 overflow-hidden rounded-2xl border-2 px-2 py-2 text-left shadow-sm transition-colors duration-150 sm:px-3 ${item.cardClass} ${
              selected ? item.selectedClass : item.idleClass
            }`}
          >
            <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <span className={`inline-flex max-w-full truncate rounded-lg px-1.5 py-0.5 text-[11px] font-semibold leading-none sm:px-2 sm:text-xs ${item.iconClass}`}>
                {item.title}
              </span>
              <span className="max-w-full truncate text-[11px] font-medium leading-none text-gray-700 dark:text-gray-200 sm:text-xs">
                {periodLabel}
              </span>
            </div>
            <p className="mt-1 w-full min-w-0 [container-type:inline-size]">
              <span
                className="block whitespace-nowrap font-bold leading-none tabular-nums tracking-tight text-gray-950 dark:text-white"
                style={{ fontSize: fittedSize(amountLabel.length, CURRENCY_EM, '1.5rem') }}
              >
                {amountLabel}
              </span>
            </p>
            <p className="mt-1 w-full min-w-0 [container-type:inline-size]">
              <span
                className="block whitespace-nowrap font-medium leading-none tabular-nums text-gray-700 dark:text-gray-200"
                style={{ fontSize: fittedSize(countLabel.length, COUNT_EM, '0.875rem') }}
              >
                {countLabel}
              </span>
            </p>
          </button>
        );
      })}
    </div>
  );
}
