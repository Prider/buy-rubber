'use client';

import { useRef } from 'react';
import { PurchasesList, PurchasesListRef } from '@/components/purchases/PurchasesList';

export default function PurchasesListPage() {
  const purchasesListRef = useRef<PurchasesListRef>(null);

  const handleRefresh = () => {
    purchasesListRef.current?.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            รายการรับซื้อทั้งหมด
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            ดูและจัดการประวัติการรับซื้อทั้งหมด
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:rotate-180" 
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

