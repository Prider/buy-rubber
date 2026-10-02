'use client';

import { memo } from 'react';
import { formatNumber } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';

interface TodayWeightsCardByProductTypeProps {
  stats: DashboardStats;
}

export const TodayWeightsCardByProductType = memo<TodayWeightsCardByProductTypeProps>(({ stats }) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50 to-indigo-100 p-3.5 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-indigo-800/30 dark:from-indigo-900/20 dark:to-indigo-800/10 md:p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between gap-2 md:mb-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 rounded-lg bg-white/80 p-2 shadow-sm dark:bg-gray-900/40">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-5a2 2 0 012-2h2a2 2 0 012 2v5m-8 0h8m-8 0a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                น้ำหนักวันนี้
              </h3>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                รวมตามประเภทสินค้า
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white dark:bg-indigo-500">
            วันนี้
          </span>
        </div>

        {/* Product Type Grid */}
        {stats.todayPurchasesByProductType && stats.todayPurchasesByProductType.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11.5rem),1fr))] gap-2.5">
            {stats.todayPurchasesByProductType.map((pt, index) => {
              const formattedWeight = formatNumber(pt.totalWeight || 0);
              return (
                <div
                  key={pt.productTypeId || `pt-w-${index}`}
                  className="group relative bg-white/80 dark:bg-gray-900/40 rounded-lg p-3 shadow-sm border border-indigo-100/50 dark:border-indigo-800/30 hover:shadow-md hover:border-indigo-200/70 dark:hover:border-indigo-700/50 transition-all duration-200"
                >
                  {/* Decorative accent */}
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-l-lg"></div>

                  <div className="pl-2.5">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {pt.productTypeCode}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {pt.count || 0} รายการ
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 truncate" title={pt.productTypeName}>
                      {pt.productTypeName}
                    </h4>

                    <div className="flex items-baseline gap-1">
                      <p className="break-words text-sm font-bold tabular-nums text-indigo-700 dark:text-indigo-300 sm:text-base">
                        {formattedWeight}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">กก.</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mb-3">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">ยังไม่มีรายการรับซื้อวันนี้</p>
          </div>
        )}
      </div>

      {/* Decorative element */}
      <div className="absolute -right-3 -bottom-3 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-700/10 rounded-full opacity-20"></div>
    </div>
  );
});

TodayWeightsCardByProductType.displayName = 'TodayWeightsCardByProductType';

