'use client';

import { PurchasesList } from '@/components/purchases/PurchasesList';

export default function PurchasesListPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">รายการรับซื้อ</h1>
        <p className="text-gray-600 dark:text-gray-400">ดูและจัดการรายการรับซื้อทั้งหมด</p>
      </div>
      <PurchasesList />
    </div>
  );
}

