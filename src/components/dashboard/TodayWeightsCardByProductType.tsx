'use client';

import { memo } from 'react';
import { formatNumber } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';

interface TodayWeightsCardByProductTypeProps {
  stats: DashboardStats;
}

export const TodayWeightsCardByProductType = memo<TodayWeightsCardByProductTypeProps>(({ stats }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-200 border border-indigo-200/50 dark:border-indigo-800/30 w-full h-full">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/80 dark:bg-gray-900/40 rounded-lg shadow-sm">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-5a2 2 0 012-2h2a2 2 0 012 2v5m-8 0h8m-8 0a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                น้ำหนักวันนี้
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                รวมตามประเภทสินค้า
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 dark:bg-indigo-500 text-white">
            วันนี้
          </span>
        </div>

        {/* Product Type Grid */}
        {stats.todayPurchasesByProductType && stats.todayPurchasesByProductType.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
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
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {pt.productTypeCode}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {pt.count || 0} รายการ
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 truncate" title={pt.productTypeName}>
                      {pt.productTypeName}
                    </h4>

                    <div className="flex items-baseline gap-1">
                      <p className="text-base font-bold text-indigo-700 dark:text-indigo-300">
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

