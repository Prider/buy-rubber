'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface RecentSalesListProps {
  sales: any[];
}

export default function RecentSalesList({ sales }: RecentSalesListProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            รายการขายล่าสุด
          </h2>
          {sales.length > 0 && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {sales.length} รายการ
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 p-4 min-h-0">
        {sales.length > 0 ? (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {sales.map((sale: any, idx: number) => {
              return (
                <div
                  key={sale.id}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-full flex items-center justify-center font-semibold text-emerald-700 dark:text-emerald-300 text-xs">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {sale.companyName || sale.saleNo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {sale.productType?.name || '-'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatNumber(sale.weight)} กก.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(sale.date).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ยังไม่มีรายการขาย</p>
          </div>
        )}
      </div>
    </div>
  );
}
