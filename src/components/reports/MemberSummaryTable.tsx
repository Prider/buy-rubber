import { formatCurrency, formatNumber } from '@/lib/utils';

interface MemberSummaryTableProps {
  data: any[];
}

export default function MemberSummaryTable({ data }: MemberSummaryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              สมาชิก
            </th>
            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              จำนวนครั้ง
            </th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              น้ำหนักรวม (กก.)
            </th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              ยอดเงินรวม
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item: any, idx: number) => (
            <tr key={item.member?.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <span>{item.member?.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {item.count} ครั้ง
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                {formatNumber(item.totalWeight)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400 text-lg">
                {formatCurrency(item.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

