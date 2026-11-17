'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EXPENSE_SLICE_COLORS, expensePieSlices, formatExpenseShare, type ExpensePieSlice } from '@/lib/expensePieSlices';
import { formatCurrency } from '@/lib/utils';
import DashboardHeading, { type DashboardHeadingTone } from './DashboardHeading';
import type { ActivityRow } from './ActivityList';

type ExpenseSlice = ExpensePieSlice;

function expenseSliceLabel(row: ActivityRow): string {
  return row.title || 'ค่าใช้จ่าย';
}

function slicesFromRows(
  rows: ActivityRow[],
  colors: readonly string[],
  groupBy: (row: ActivityRow) => string,
): ExpenseSlice[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!row.amount) continue;
    const category = groupBy(row) || 'ไม่ระบุ';
    totals.set(category, (totals.get(category) || 0) + row.amount);
  }

  return expensePieSlices(
    [...totals.entries()].map(([category, totalAmount]) => ({ category, totalAmount })),
    colors,
  );
}

function PieFigure({
  slices,
  dark,
  reduceMotion,
  stacked,
}: {
  slices: ExpenseSlice[];
  dark: boolean;
  reduceMotion: boolean;
  stacked: boolean;
}) {
  const chart = (
    <div className="relative h-full min-h-[7.5rem]">
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
  );

  const legend = (
    <ul className={`flex min-h-0 flex-col gap-1.5 overflow-y-auto overscroll-y-contain ${stacked ? 'py-2 pr-3' : 'justify-center py-2 pr-3'}`}>
      {slices.map((slice) => (
        <li key={slice.category} className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: slice.color }} />
            <span className="truncate text-xs font-semibold text-gray-950 dark:text-white" title={slice.category}>
              {slice.category}
            </span>
          </div>
          <p className="pl-4 text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
            {formatCurrency(slice.amount)} · {formatExpenseShare(slice.percent)}
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`grid min-h-0 flex-1 ${stacked ? 'grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)]' : 'min-h-[14rem] grid-cols-[minmax(0,1.15fr)_minmax(7.5rem,1fr)] lg:min-h-0'}`}>
      {chart}
      {legend}
    </div>
  );
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
        {formatExpenseShare(slice.percent)}
      </p>
    </div>
  );
}

export interface PiePanel {
  label: string;
  groupBy: (row: ActivityRow) => string;
}

export default function ExpensePieChart({
  title,
  rows,
  emptyLabel,
  detail,
  tone = 'rose',
  colors = EXPENSE_SLICE_COLORS,
  groupBy = expenseSliceLabel,
  panels,
  itemCount,
  amountClass = 'text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200',
}: {
  title: string;
  rows: ActivityRow[];
  emptyLabel: string;
  detail?: string;
  tone?: DashboardHeadingTone;
  colors?: readonly string[];
  groupBy?: (row: ActivityRow) => string;
  panels?: readonly PiePanel[];
  itemCount?: number;
  amountClass?: string;
}) {
  const groups = useMemo(() => {
    const specs = panels && panels.length > 0 ? panels : [{ label: '', groupBy }];
    return specs.map((panel) => ({
      label: panel.label,
      slices: slicesFromRows(rows, colors, panel.groupBy),
    }));
  }, [rows, colors, groupBy, panels]);
  const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const hasSlices = groups.some((group) => group.slices.length > 0);
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
      <div className="flex shrink-0 items-baseline justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <div className="flex min-w-0 items-baseline gap-2">
          <DashboardHeading tone={tone} className="min-w-0 truncate">
            {title}
          </DashboardHeading>
          {itemCount ? (
            <span className="shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-200">({itemCount} รายการ)</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-baseline gap-3">
          {detail ? (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{detail}</span>
          ) : null}
          {hasSlices ? (
            <span className={amountClass}>
              {formatCurrency(total)}
            </span>
          ) : null}
        </div>
      </div>
      {hasSlices ? (
        <div className={groups.length > 1 ? 'grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2' : 'flex min-h-0 flex-1 flex-col'}>
          {groups.map((group, index) => (
            <div
              key={group.label || 'pie'}
              className={`flex min-h-0 min-w-0 flex-col ${index > 0 ? 'border-t border-gray-200 dark:border-gray-700 sm:border-l sm:border-t-0' : ''}`}
            >
              {group.label ? (
                <p className="shrink-0 px-3 pt-2 text-xs font-semibold text-gray-700 dark:text-gray-200">{group.label}</p>
              ) : null}
              {group.slices.length > 0 ? (
                <PieFigure slices={group.slices} dark={dark} reduceMotion={reduceMotion} stacked={groups.length > 1} />
              ) : (
                <p className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-gray-700 dark:text-gray-200">{emptyLabel}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-gray-700 dark:text-gray-200">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}
