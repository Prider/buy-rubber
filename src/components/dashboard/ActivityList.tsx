import { formatCurrency, formatNumber } from '@/lib/utils';
import DashboardHeading, { type DashboardHeadingTone } from './DashboardHeading';
import type { DashboardMetric } from './SummaryMetricCards';

export interface ActivityRow {
  id: string;
  title: string;
  detail: string;
  amount: number;
  when: string;
}

interface ActivityListProps {
  title: string;
  metric: DashboardMetric;
  rows: ActivityRow[];
  emptyLabel: string;
}

const amountClass: Record<DashboardMetric, string> = {
  purchases: 'text-sky-900 dark:text-sky-100',
  sales: 'text-emerald-900 dark:text-emerald-100',
  serviceFees: 'text-amber-900 dark:text-amber-100',
  expenses: 'text-rose-900 dark:text-rose-100',
};

const titleTone: Record<DashboardMetric, DashboardHeadingTone> = {
  purchases: 'sky',
  sales: 'emerald',
  serviceFees: 'amber',
  expenses: 'rose',
};

export default function ActivityList({ title, metric, rows, emptyLabel }: ActivityListProps) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <DashboardHeading tone={titleTone[metric]} className="min-w-0 truncate">
          {title}
        </DashboardHeading>
        {rows.length > 0 ? (
          <span className="shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-200">{rows.length} รายการ</span>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-950 dark:text-white">{row.title}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-gray-700 dark:text-gray-200">{row.detail}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-bold tabular-nums ${amountClass[metric]}`}>
                  {formatCurrency(row.amount)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">{row.when}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-gray-700 dark:text-gray-200">{emptyLabel}</p>
      )}
    </section>
  );
}

export function formatActivityWhen(date: string | Date): string {
  return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export function formatWeightDetail(name: string | undefined, weight: number | null | undefined): string {
  const label = name || '-';
  return `${label} · ${formatNumber(weight || 0)} กก.`;
}
