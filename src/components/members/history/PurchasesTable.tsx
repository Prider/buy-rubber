'use client';

import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

interface PurchasesTableProps {
  purchases: any[];
  totalCount?: number;
}

export const PurchasesTable = ({ purchases, totalCount }: PurchasesTableProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 dark:bg-gray-800 dark:from-gray-700 dark:to-gray-600 ">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">รายการรับซื้อ</h3>
      <span className="text-sm text-gray-600 dark:text-gray-300">ทั้งหมด {totalCount ?? purchases.length} รายการ</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200.dark:border-gray-600">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">วันที่</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">ประเภทสินค้า</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700.dark:text-gray-200 uppercase tracking-wider">น้ำหนักสุทธิ</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700.dark:text-gray-200 uppercase tracking-wider">ราคา/กก.</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700.dark:text-gray-200 uppercase tracking-wider">ยอดรวม</th>
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
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {formatDate(purchase.date)}{' '}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{purchase.productType?.name || '-'}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                {formatNumber(purchase.netWeight)} กก.
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                {formatNumber(purchase.basePrice)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-green-600 dark:text-green-400">
                {formatCurrency(purchase.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

