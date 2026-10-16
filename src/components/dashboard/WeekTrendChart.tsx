'use client';

import { useEffect, useState } from 'react';
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
import type { TrendPoint } from '@/lib/dashboard/trend';
import DashboardHeading from './DashboardHeading';

const compactAmount = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

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
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-600 dark:bg-gray-900">
      <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-gray-950 dark:text-white">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeekTrendChart({ points }: { points: TrendPoint[] }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const tickFill = dark ? '#e2e8f0' : '#334155';
  const gridStroke = dark ? '#374151' : '#e5e7eb';

  return (
    <section className="flex min-h-[16rem] min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:h-full lg:min-h-0">
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <DashboardHeading tone="trend">แนวโน้ม 7 วัน</DashboardHeading>
        <div className="flex gap-3 text-xs font-medium text-gray-700 dark:text-gray-200">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-sky-600" />
            รับซื้อ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-600" />
            ขาย
          </span>
        </div>
      </div>
      <div className="relative min-h-[12rem] flex-1 lg:min-h-0">
        {points.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-gray-700 dark:text-gray-200">
            ยังไม่มีข้อมูลแนวโน้ม
          </p>
        ) : (
          <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="22%">
              <CartesianGrid stroke={gridStroke} strokeDasharray="4 8" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickFill, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickFill, fontSize: 12 }}
                tickFormatter={(value: number) => compactAmount.format(value)}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
              <Bar dataKey="purchaseAmount" name="รับซื้อ" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="saleAmount" name="ขาย" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
