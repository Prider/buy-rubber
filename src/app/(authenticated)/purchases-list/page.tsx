'use client';

import { PurchasesList } from '@/components/purchases/PurchasesList';

export default function PurchasesListPage() {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="relative z-0 flex min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <PurchasesList />
      </div>
    </div>
  );
}
