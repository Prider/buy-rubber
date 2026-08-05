'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { CHART_SERIES, type ProfitLossRow } from './types';

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

export function ProfitLossChart({ data }: { data: ChartPoint[] }) {
  const hasRows = data.length > 0;

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
              <span className="h-1 w-6 rounded-full" style={{ backgroundColor: series.color }} />
              {series.label}
            </div>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        {hasRows ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 8 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 8" vertical={false} />
              <XAxis
                dataKey="periodLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value: number) => formatCurrency(value)}
                width={88}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
              {CHART_SERIES.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={4}
                  strokeLinecap="round"
                  dot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: series.color }}
                  activeDot={{ r: 8, strokeWidth: 3, fill: series.color, stroke: '#ffffff' }}
                />
              ))}
            </LineChart>
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
