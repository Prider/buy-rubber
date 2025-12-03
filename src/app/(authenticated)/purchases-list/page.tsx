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
          className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          รีเฟรช
        </button>
      </div>

      {/* Purchases List Component */}
      <PurchasesList ref={purchasesListRef} />
    </div>
  );
}

