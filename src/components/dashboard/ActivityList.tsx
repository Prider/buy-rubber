import { formatCurrency, formatNumber } from '@/lib/utils';
import DashboardHeading, { type DashboardHeadingTone } from './DashboardHeading';
import type { DashboardMetric } from './SummaryMetricCards';

export interface ActivityRow {
  id: string;
  title: string;
  detail: string;
  amount: number;
  when: string;
  weight?: number;
  /** Product-type slice label for the sales pie. */
  category?: string;
  /** Destination company slice label for the sales pie. */
  company?: string;
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
  expenses: 'text-rose-900 dark:text-rose-100',
};

const titleTone: Record<DashboardMetric, DashboardHeadingTone> = {
  purchases: 'sky',
  sales: 'emerald',
  expenses: 'rose',
};

function groupByDay(rows: ActivityRow[]): Array<{ when: string; rows: ActivityRow[] }> {
  const groups: Array<{ when: string; rows: ActivityRow[] }> = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.when === row.when) last.rows.push(row);
    else groups.push({ when: row.when, rows: [row] });
  }
  return groups;
}

function sumAmount(rows: ActivityRow[]): number {
  return rows.reduce((sum, row) => sum + (row.amount || 0), 0);
}

function sumWeight(rows: ActivityRow[]): number {
  return rows.reduce((sum, row) => sum + (row.weight || 0), 0);
}

export default function ActivityList({ title, metric, rows, emptyLabel }: ActivityListProps) {
  const total = sumAmount(rows);
  const totalWeight = sumWeight(rows);
  const showWeight = rows.some((row) => row.weight != null);
  const groups = groupByDay(rows);

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <div className="flex min-w-0 items-baseline gap-2">
          <DashboardHeading tone={titleTone[metric]} className="min-w-0 truncate">
            {title}
          </DashboardHeading>
          {rows.length > 0 ? (
            <span className="shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-200">({rows.length} รายการ)</span>
          ) : null}
        </div>
        {rows.length > 0 ? (
          <div className="shrink-0 text-right">
            <p className={`text-sm font-bold tabular-nums ${amountClass[metric]}`}>{formatCurrency(total)}</p>
            {showWeight ? (
              <p className="text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200">{formatNumber(totalWeight)} กก.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <ul className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain">
          {groups.map((group) => (
            <li key={group.when}>
              <div className="sticky top-0 z-10 flex items-baseline justify-between gap-2 border-y border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900">
                <span className="shrink-0 text-xs font-bold text-gray-950 dark:text-white">{group.when}</span>
                <span className="min-w-0 truncate text-right text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
                  {group.rows.length} รายการ
                  {showWeight ? ` · ${formatNumber(sumWeight(group.rows))} กก.` : ''}
                  {` · ${formatCurrency(sumAmount(group.rows))}`}
                </span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.rows.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-950 dark:text-white">{row.title}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-gray-700 dark:text-gray-200">{row.detail}</p>
                    </div>
                    <p className={`shrink-0 text-sm font-bold tabular-nums ${amountClass[metric]}`}>
                      {formatCurrency(row.amount)}
                    </p>
                  </li>
                ))}
              </ul>
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

export function formatWeightDetail(
  name: string | undefined,
  weight: number | null | undefined,
  pricePerKg?: number | null,
): string {
  const base = `${name || '-'} · ${formatNumber(weight || 0)} กก.`;
  if (pricePerKg == null || Number.isNaN(pricePerKg)) return base;
  return `${base} · ${formatCurrency(pricePerKg)}/กก.`;
}
