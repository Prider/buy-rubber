'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { CHART_SERIES, type ProfitLossRow } from './types';

const compactAmount = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatAxisAmount(value: number): string {
  return compactAmount.format(value);
}

interface ChartPoint extends ProfitLossRow {
  periodLabel: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-600 dark:bg-gray-900/95">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function priceOrNull(value: number): number | null {
  return value > 0 ? value : null;
}

export function ProfitLossChart({ data }: { data: ChartPoint[] }) {
  const hasRows = data.length > 0;
  const points = data.map((row) => ({
    ...row,
    purchasePricePerKg: priceOrNull(row.purchasePricePerKg),
    salePricePerKg: priceOrNull(row.salePricePerKg),
  }));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">แนวโน้ม</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            ค่าใช้จ่าย · ราคาซื้อ/กก. · ราคาขาย/กก.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {CHART_SERIES.map((series) => (
            <div key={series.key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: series.color }} />
              {series.label}
            </div>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        {hasRows ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 12, right: 8, left: 4, bottom: 8 }} barGap={4} barCategoryGap="22%">
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 8" vertical={false} />
              <XAxis
                dataKey="periodLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                yAxisId="amount"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={formatAxisAmount}
                width={64}
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value: number) => formatCurrency(value)}
                domain={[(min: number) => Math.floor(min - 2), (max: number) => Math.ceil(max + 2)]}
                width={72}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
              {CHART_SERIES.map((series) => (
                <Bar
                  key={series.key}
                  yAxisId={series.axis}
                  dataKey={series.key}
                  name={series.label}
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 dark:border-gray-600 dark:bg-gray-900/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">No data to display for the selected range</p>
          </div>
        )}
      </div>
    </div>
  );
}
