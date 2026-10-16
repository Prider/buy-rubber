'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import DashboardHeading from './DashboardHeading';
import type { ActivityRow } from './ActivityList';

const SLICE_COLORS = [
  '#e11d48',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#6366f1',
];

const percentFormat = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

interface ExpenseSlice {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

function slicesFromRows(rows: ActivityRow[]): ExpenseSlice[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!row.amount) continue;
    const category = row.title || 'ค่าใช้จ่าย';
    totals.set(category, (totals.get(category) || 0) + row.amount);
  }

  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  if (total <= 0) return [];

  return entries.map(([category, amount], index) => ({
    category,
    amount,
    percent: (amount / total) * 100,
    color: SLICE_COLORS[index % SLICE_COLORS.length],
  }));
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ExpenseSlice }>;
}) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-600 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{slice.category}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-gray-950 dark:text-white">
        {formatCurrency(slice.amount)}
      </p>
      <p className="text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
        {percentFormat.format(slice.percent)}%
      </p>
    </div>
  );
}

export default function ExpensePieChart({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: ActivityRow[];
  emptyLabel: string;
}) {
  const slices = useMemo(() => slicesFromRows(rows), [rows]);
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const [dark, setDark] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setDark(root.classList.contains('dark'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduceMotion(motion.matches);
    syncMotion();
    motion.addEventListener('change', syncMotion);

    return () => {
      observer.disconnect();
      motion.removeEventListener('change', syncMotion);
    };
  }, []);

  return (
    <section className="flex min-h-[16rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <DashboardHeading tone="rose" className="min-w-0 truncate">
          {title}
        </DashboardHeading>
        {slices.length > 0 ? (
          <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200">
            {formatCurrency(total)}
          </span>
        ) : null}
      </div>
      {slices.length > 0 ? (
        <div className="grid min-h-[14rem] flex-1 grid-cols-[minmax(0,1.15fr)_minmax(7.5rem,1fr)] lg:min-h-0">
          <div className="relative min-h-0">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius="78%"
                    stroke={dark ? '#1f2937' : '#ffffff'}
                    strokeWidth={2}
                    isAnimationActive={!reduceMotion}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.category} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ul className="flex min-h-0 flex-col justify-center gap-1.5 overflow-y-auto overscroll-y-contain py-2 pr-3">
            {slices.map((slice) => (
              <li key={slice.category} className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: slice.color }} />
                  <span className="truncate text-xs font-semibold text-gray-950 dark:text-white" title={slice.category}>
                    {slice.category}
                  </span>
                </div>
                <p className="pl-4 text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
                  {formatCurrency(slice.amount)} · {percentFormat.format(slice.percent)}%
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-gray-700 dark:text-gray-200">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}
