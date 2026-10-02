'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface RecentPurchasesListProps {
  purchases: any[];
}

export default function RecentPurchasesList({ purchases }: RecentPurchasesListProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-3 py-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-gray-900 dark:text-white sm:text-base">
            <span className="shrink-0 rounded-lg bg-primary-100 p-1.5 dark:bg-primary-900/30">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            <span className="truncate">รายการรับซื้อล่าสุด</span>
          </h2>
          {purchases.length > 0 && (
            <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
              {purchases.length} รายการ
            </span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        {purchases.length > 0 ? (
          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {purchases.map((purchase: any, idx: number) => {
              return (
                <div
                  key={purchase.id}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-transparent p-2.5 transition-colors duration-200 hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 sm:gap-3 sm:p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-xs font-semibold text-primary-700 dark:from-primary-900/30 dark:to-primary-800/20 dark:text-primary-300">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {purchase.member?.name}
                      </p>
                      <div className="mt-0.5 flex min-w-0 items-center gap-2">
                        <span className="inline-flex max-w-[55%] items-center truncate rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {purchase.productType?.name}
                        </span>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {formatNumber(purchase.dryWeight)} กก.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-primary-600 dark:text-primary-400 sm:text-base">
                      {formatCurrency(purchase.totalAmount)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(purchase.date).toLocaleDateString('th-TH', {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ยังไม่มีรายการรับซื้อ</p>
          </div>
        )}
      </div>
    </div>
  );
}

