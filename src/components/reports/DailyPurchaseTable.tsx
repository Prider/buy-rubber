import { memo, useMemo, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DailyPurchaseRow {
  id: string;
  date: string | Date;
  purchaseNo: string;
  member?: { name?: string };
  productType?: { name?: string };
  dryWeight: number;
  totalAmount: number;
}

interface DailyPurchaseTableProps {
  data: DailyPurchaseRow[];
  offset?: number;
}

const PAGE_SIZE = 100;

function DailyPurchaseTableComponent({ data, offset = 0 }: DailyPurchaseTableProps) {
  const [page, setPage] = useState(1);

  const { pagedData, totalPages, pageStartIndex } = useMemo(() => {
    const totalPagesCalc = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPagesCalc);
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return {
      pagedData: data.slice(start, end),
      totalPages: totalPagesCalc,
      pageStartIndex: start,
    };
  }, [data, page]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="overflow-x-auto space-y-3">
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
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              ประเภทสินค้า
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
          {pagedData.map((item: DailyPurchaseRow, idx: number) => {
            const displayIndex = offset + pageStartIndex + idx + 1;
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
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                  {item.productType?.name || '-'}
                </span>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pb-2 text-sm text-gray-600 dark:text-gray-300">
          <button
            onClick={handlePrev}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed hover:border-indigo-300 dark:hover:border-indigo-600 transition"
          >
            ก่อนหน้า
          </button>
          <div className="font-medium">
            หน้า {page} / {totalPages} • แสดง {pagedData.length} จาก {data.length} รายการ
          </div>
          <button
            onClick={handleNext}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed hover:border-indigo-300 dark:hover:border-indigo-600 transition"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}

export const DailyPurchaseTable = memo(DailyPurchaseTableComponent);
export default DailyPurchaseTable;

