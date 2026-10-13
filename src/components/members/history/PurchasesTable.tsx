'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';

interface PurchasesTableProps {
  purchases: any[];
  totalCount?: number;
}

function PurchaseDateCell({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <>–</>;

  const day = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date);
  const time = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return (
    <>
      <div className="leading-tight">{day}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
    </>
  );
}

export const PurchasesTable = ({ purchases, totalCount }: PurchasesTableProps) => (
  <div className="bg-white dark:bg-gray-800">
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">รายการรับซื้อ</h3>
      <span className="text-xs text-gray-600 dark:text-gray-300">ทั้งหมด {totalCount ?? purchases.length} รายการ</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200.dark:border-gray-600">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">วันที่</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">เลขที่รับซื้อ</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">ประเภทสินค้า</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700.dark:text-gray-200 uppercase tracking-wider">น้ำหนักสุทธิ</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700.dark:text-gray-200 uppercase tracking-wider">ราคา/กก.</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700.dark:text-gray-200 uppercase tracking-wider">ยอดรวม</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {purchases.map((purchase, index) => (
            <tr
              key={purchase.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'
              }`}
            >
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                <PurchaseDateCell value={purchase.date} />
              </td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                {purchase.purchaseNo || '-'}
              </td>
              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{purchase.productType?.name || '-'}</td>
              <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                {formatNumber(purchase.netWeight)} กก.
              </td>
              <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                {formatNumber(purchase.basePrice)}
              </td>
              <td className="px-3 py-2 text-sm text-right font-bold text-green-600 dark:text-green-400">
                {formatCurrency(purchase.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

