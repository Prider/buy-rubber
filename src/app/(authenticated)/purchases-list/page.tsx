'use client';

import { useRef } from 'react';
import { PurchasesList, PurchasesListRef } from '@/industries/rubber/ui/purchases/PurchasesList';

export default function PurchasesListPage() {
  const purchasesListRef = useRef<PurchasesListRef>(null);

  const handleRefresh = () => {
    purchasesListRef.current?.refresh();
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg sm:h-12 sm:w-12">
            <svg className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="min-w-0 text-lg font-bold tracking-tight sm:text-2xl">
            <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
              ประวัติการรับซื้อทั้งหมด
            </span>
          </h1>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 dark:focus:ring-offset-gray-800 sm:w-auto sm:shrink-0"
        >
          <svg
            className="h-5 w-5 transition-transform group-hover:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Purchases List Component */}
      <PurchasesList ref={purchasesListRef} />
    </div>
  );
}

