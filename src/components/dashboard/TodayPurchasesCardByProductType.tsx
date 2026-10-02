'use client';

import { memo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';

interface TodayPurchasesCardByProductTypeProps {
  stats: DashboardStats;
}

export const TodayPurchasesCardByProductType = memo<TodayPurchasesCardByProductTypeProps>(({ stats }) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-primary-200/50 bg-gradient-to-br from-primary-50 to-primary-100 p-3.5 shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-primary-800/30 dark:from-primary-900/20 dark:to-primary-800/10 md:p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between gap-2 md:mb-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 rounded-lg bg-white/80 p-2 shadow-sm dark:bg-gray-900/40">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-primary-700 dark:text-primary-300">
                รับซื้อวันนี้
              </h3>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                แบ่งตามประเภทสินค้า
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white dark:bg-primary-500">
            วันนี้
          </span>
        </div>

        {/* Product Type Grid */}
        {stats.todayPurchasesByProductType && stats.todayPurchasesByProductType.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11.5rem),1fr))] gap-2.5">
            {stats.todayPurchasesByProductType.map((pt, index) => {
              const formattedPtAmount = formatCurrency(pt.totalAmount || 0);
              return (
                <div
                  key={pt.productTypeId || `pt-${index}`}
                  className="group relative bg-white/80 dark:bg-gray-900/40 rounded-lg p-3 shadow-sm border border-primary-100/50 dark:border-primary-800/30 hover:shadow-md hover:border-primary-200/70 dark:hover:border-primary-700/50 transition-all duration-200"
                >
                  {/* Decorative accent */}
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-primary-500 to-primary-600 rounded-l-lg"></div>
                  
                  <div className="pl-2.5">
                    {/* Product Type Info */}
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded bg-primary-100 px-2 py-0.5 font-mono text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                        {pt.productTypeCode}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {pt.count || 0} รายการ
                      </span>
                    </div>
                    
                    {/* Product Type Name */}
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 truncate" title={pt.productTypeName}>
                      {pt.productTypeName}
                    </h4>
                    
                    {/* Amount */}
                    <div className="flex items-baseline gap-1">
                      <p className="break-words text-sm font-bold tabular-nums text-primary-700 dark:text-primary-300 sm:text-base">
                        {formattedPtAmount}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-3">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">ยังไม่มีรายการรับซื้อวันนี้</p>
          </div>
        )}
      </div>
      
      {/* Decorative element */}
      <div className="absolute -right-3 -bottom-3 w-24 h-24 bg-primary-200/20 dark:bg-primary-700/10 rounded-full opacity-20"></div>
    </div>
  );
});

TodayPurchasesCardByProductType.displayName = 'TodayPurchasesCardByProductType';

