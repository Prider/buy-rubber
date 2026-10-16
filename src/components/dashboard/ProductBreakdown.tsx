import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ProductBreakdownRow } from '@/hooks/useDashboardData';
import DashboardHeading from './DashboardHeading';

interface ProductBreakdownProps {
  rows: ProductBreakdownRow[];
  selectedId: string | null;
  onSelect: (productTypeId: string) => void;
}

export default function ProductBreakdown({ rows, selectedId, onSelect }: ProductBreakdownProps) {
  return (
    <section>
      <DashboardHeading tone="violet">แบ่งตามประเภท</DashboardHeading>
      {rows.length > 0 ? (
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-2.5">
          {rows.map((row) => {
            const id = row.productTypeId || '';
            const selected = selectedId === id && id !== '';
            return (
              <button
                key={id || row.productTypeName}
                type="button"
                aria-pressed={selected}
                onClick={() => id && onSelect(id)}
                className={`rounded-2xl border-2 p-3 text-left shadow-sm transition-colors duration-150 ${
                  selected
                    ? 'border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(to_right,#3b82f6,#4f46e5)_border-box] dark:[background:linear-gradient(#1f2937,#1f2937)_padding-box,linear-gradient(to_right,#2563eb,#4338ca)_border-box]'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-950 dark:text-white" title={row.productTypeName}>
                    {row.productTypeName}
                  </span>
                  {row.productTypeCode ? (
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                      {row.productTypeCode}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-200">
                  {row.count || 0} รายการ
                </p>
                <p className="mt-1 text-base font-bold tabular-nums text-gray-950 dark:text-white">
                  {formatCurrency(row.totalAmount || 0)}
                </p>
                <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                  {formatNumber(row.totalWeight || 0)} กก.
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
          ยังไม่มีรายการในช่วงนี้
        </p>
      )}
    </section>
  );
}
