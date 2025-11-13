'use client';

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
  categorySummary: Array<{ category: string; totalAmount: number; count: number }>;
  totalAmount?: number;
}

export default function ExpenseReportTable({ data, categorySummary, totalAmount }: ExpenseReportTableProps) {
  const pageTotal = data.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const footerTotal = typeof totalAmount === 'number' ? totalAmount : pageTotal;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
        <div className="overflow-x-auto">
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
                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                    {new Date(expense.date || expense.createdAt || '').toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    {expense.expenseNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400 text-right">
                    {formatCurrency(expense.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                  รวมทั้งหมด
                </td>
                <td className="px-6 py-4 text-right text-base font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(footerTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {categorySummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categorySummary.map((summary) => (
            <div
              key={summary.category}
              className="rounded-2xl border border-emerald-200/60 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-900/20 dark:via-gray-900 dark:to-teal-900/20 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    {summary.category}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalAmount)}
                  </p>
                  <p className="mt-3 text-sm text-emerald-700/80 dark:text-emerald-200/90">
                    {summary.count.toLocaleString('th-TH')} รายการ
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
