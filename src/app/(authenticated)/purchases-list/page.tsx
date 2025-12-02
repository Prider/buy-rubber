'use client';

import { PurchasesList } from '@/components/purchases/PurchasesList';

export default function PurchasesListPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          รายการรับซื้อทั้งหมด
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          ดูและจัดการประวัติการรับซื้อทั้งหมด
        </p>
      </div>

      {/* Purchases List Component */}
      <PurchasesList />
    </div>
  );
}

