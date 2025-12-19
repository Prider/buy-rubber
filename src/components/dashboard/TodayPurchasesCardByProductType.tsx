'use client';

import { memo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';

interface TodayPurchasesCardByProductTypeProps {
  stats: DashboardStats;
}

export const TodayPurchasesCardByProductType = memo<TodayPurchasesCardByProductTypeProps>(({ stats }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-200 border border-primary-200/50 dark:border-primary-800/30 w-full h-full">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/80 dark:bg-gray-900/40 rounded-lg shadow-sm">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                รับซื้อวันนี้
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                แบ่งตามประเภทสินค้า
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600 dark:bg-primary-500 text-white">
            วันนี้
          </span>
        </div>

        {/* Product Type Grid */}
        {stats.todayPurchasesByProductType && stats.todayPurchasesByProductType.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
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
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                        {pt.productTypeCode}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {pt.count || 0} รายการ
                      </span>
                    </div>
                    
                    {/* Product Type Name */}
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 truncate" title={pt.productTypeName}>
                      {pt.productTypeName}
                    </h4>
                    
                    {/* Amount */}
                    <div className="flex items-baseline gap-1">
                      <p className="text-base font-bold text-primary-700 dark:text-primary-300">
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

