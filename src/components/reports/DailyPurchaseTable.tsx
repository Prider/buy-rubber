import { formatCurrency, formatNumber } from '@/lib/utils';

interface DailyPurchaseTableProps {
  data: any[];
  offset?: number;
}

export default function DailyPurchaseTable({ data, offset = 0 }: DailyPurchaseTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              วันที่
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              เลขที่
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              สมาชิก
            </th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              น้ำหนัก (กก.)
            </th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              ยอดเงิน
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item: any, idx: number) => {
            const displayIndex = offset + idx + 1;
            return (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {displayIndex}
                  </span>
                  {new Date(item.date).toLocaleString('th-TH', { 
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {item.purchaseNo}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.member?.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                {formatNumber(item.dryWeight)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400">
                {formatCurrency(item.totalAmount)}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

