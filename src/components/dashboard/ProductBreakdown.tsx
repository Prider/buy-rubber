'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import type { ProductBreakdownRow } from '@/hooks/useDashboardData';
import DashboardHeading from './DashboardHeading';

interface ProductBreakdownProps {
  rows: ProductBreakdownRow[];
  selectedId: string | null;
  onSelect: (productTypeId: string) => void;
}

export default function ProductBreakdown({ rows, selectedId, onSelect }: ProductBreakdownProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setCanScrollLeft(scroller.scrollLeft > 4);
    setCanScrollRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4);
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateScrollHints();
    scroller.addEventListener('scroll', updateScrollHints, { passive: true });
    const observer = new ResizeObserver(updateScrollHints);
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', updateScrollHints);
      observer.disconnect();
    };
  }, [rows, updateScrollHints]);

  return (
    <section className="flex min-w-0 shrink-0 items-center gap-3">
      <DashboardHeading tone="violet" className="hidden shrink-0 md:block">ประเภทสินค้า</DashboardHeading>
      {rows.length > 0 ? (
        <div className="relative min-w-0 flex-1">
        <div ref={scrollerRef} className="flex min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain">
          {rows.map((row) => {
            const id = row.productTypeId || '';
            const selected = selectedId === id && id !== '';
            return (
              <button
                key={id || row.productTypeName}
                type="button"
                aria-pressed={selected}
                onClick={() => id && onSelect(id)}
                title={row.productTypeName}
                className={`flex shrink-0 items-baseline gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left shadow-sm transition-colors duration-150 ${
                  selected
                    ? 'border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(to_right,#3b82f6,#4f46e5)_border-box] dark:[background:linear-gradient(#1f2937,#1f2937)_padding-box,linear-gradient(to_right,#2563eb,#4338ca)_border-box]'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500'
                }`}
              >
                <span className="max-w-[8rem] truncate text-sm font-semibold text-gray-950 dark:text-white">
                  {row.productTypeName}
                </span>
                {row.productTypeCode ? (
                  <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                    {row.productTypeCode}
                  </span>
                ) : null}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {row.count || 0} รายการ
                </span>
                <span className="text-sm font-bold tabular-nums text-gray-950 dark:text-white">
                  {formatNumber(row.totalWeight || 0)} กก.
                </span>
              </button>
            );
          })}
        </div>
        {canScrollLeft ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-white from-45% to-transparent pr-5 text-sm font-bold tracking-tight text-violet-700 dark:from-gray-800 dark:text-violet-200"
          >
            &lt;&lt;
          </span>
        ) : null}
        {canScrollRight ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-white from-45% to-transparent pl-5 text-sm font-bold tracking-tight text-violet-700 dark:from-gray-800 dark:text-violet-200"
          >
            &gt;&gt;
          </span>
        ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-200">ยังไม่มีรายการในช่วงนี้</p>
      )}
    </section>
  );
}
