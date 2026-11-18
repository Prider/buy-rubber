'use client';

import { memo, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ExpenseReport {
  id: string;
  expenseNo: string;
  date: string;
  category: string;
  amount: number;
  description?: string | null;
  createdAt?: string;
}

interface ExpenseReportTableProps {
  data: ExpenseReport[];
  totalAmount?: number;
}

// Memoized row component
interface ExpenseRowProps {
  expense: ExpenseReport;
}

const ExpenseRow = memo<ExpenseRowProps>(({ expense }) => {
  // Memoize formatted date
  const formattedDate = useMemo(() => {
    return new Date(expense.date || expense.createdAt || '').toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [expense.date, expense.createdAt]);

  // Memoize formatted amount
  const formattedAmount = useMemo(
    () => formatCurrency(expense.amount || 0),
    [expense.amount]
  );

  // Memoize description
  const description = useMemo(
    () => expense.description || '-',
    [expense.description]
  );

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
        {expense.expenseNo}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
        {expense.category}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400 text-right">
        {formattedAmount}
      </td>
    </tr>
  );
});

ExpenseRow.displayName = 'ExpenseRow';

function ExpenseReportTableComponent({ data, totalAmount }: ExpenseReportTableProps) {
  // Memoize calculations
  const pageTotal = useMemo(
    () => data.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    [data]
  );

  const footerTotal = useMemo(
    () => typeof totalAmount === 'number' ? totalAmount : pageTotal,
    [totalAmount, pageTotal]
  );

  // Memoize formatted footer total
  const formattedFooterTotal = useMemo(
    () => formatCurrency(footerTotal),
    [footerTotal]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
        <ul className="flex min-w-0 flex-col divide-y divide-gray-200 dark:divide-gray-800 lg:hidden">
          {data.map((expense) => (
            <li key={expense.id} className="min-w-0 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(expense.date || expense.createdAt || '').toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="shrink-0 text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(expense.amount || 0)}</p>
              </div>
              <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">{expense.expenseNo}</p>
              <p className="mt-2 break-words text-sm text-gray-700 dark:text-gray-200">{expense.category}</p>
              <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">{expense.description || '-'}</p>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 bg-gray-100 px-3 py-3 dark:bg-gray-800">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">รวมทั้งหมด</span>
            <span className="shrink-0 text-base font-bold text-red-600 dark:text-red-400">{formattedFooterTotal}</span>
          </li>
        </ul>
        <div className="max-lg:hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">เลขที่</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">หมวดค่าใช้จ่าย</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">รายละเอียด</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {data.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                  รวมทั้งหมด
                </td>
                <td className="px-6 py-4 text-right text-base font-bold text-red-600 dark:text-red-400">
                  {formattedFooterTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
    </div>
  );
}

export default memo(ExpenseReportTableComponent);
