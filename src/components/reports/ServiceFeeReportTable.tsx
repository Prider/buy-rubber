'use client';

import { memo, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ServiceFeeReport {
  id: string;
  serviceFeeNo: string;
  purchaseNo?: string | null;
  date: string;
  category: string;
  amount: number;
  notes?: string | null;
  createdAt?: string;
}

interface ServiceFeeReportTableProps {
  data: ServiceFeeReport[];
  categorySummary: Array<{ category: string; totalAmount: number; count: number }>;
  totalAmount?: number;
}

interface ServiceFeeRowProps {
  fee: ServiceFeeReport;
}

const ServiceFeeRow = memo<ServiceFeeRowProps>(({ fee }) => {
  const formattedDate = useMemo(() => {
    return new Date(fee.date || fee.createdAt || '').toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [fee.date, fee.createdAt]);

  const formattedAmount = useMemo(() => formatCurrency(fee.amount || 0), [fee.amount]);

  return (
    <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
        {formattedDate}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
        {fee.serviceFeeNo}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
        {fee.purchaseNo || '-'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
        {fee.category}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{fee.notes || '-'}</td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">
        {formattedAmount}
      </td>
    </tr>
  );
});

ServiceFeeRow.displayName = 'ServiceFeeRow';

interface CategoryCardProps {
  summary: { category: string; totalAmount: number; count: number };
}

const CategoryCard = memo<CategoryCardProps>(({ summary }) => {
  const formattedAmount = useMemo(() => formatCurrency(summary.totalAmount), [summary.totalAmount]);
  const formattedCount = useMemo(() => summary.count.toLocaleString('th-TH'), [summary.count]);

  return (
    <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm dark:border-amber-700/40 dark:from-amber-900/20 dark:via-gray-900 dark:to-orange-900/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            {summary.category}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formattedAmount}</p>
          <p className="mt-3 text-sm text-amber-800/80 dark:text-amber-200/90">{formattedCount} รายการ</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

function ServiceFeeReportTableComponent({
  data,
  categorySummary,
  totalAmount,
}: ServiceFeeReportTableProps) {
  const pageTotal = useMemo(() => data.reduce((sum, fee) => sum + (fee.amount || 0), 0), [data]);
  const footerTotal = useMemo(
    () => (typeof totalAmount === 'number' ? totalAmount : pageTotal),
    [totalAmount, pageTotal],
  );
  const formattedFooterTotal = useMemo(() => formatCurrency(footerTotal), [footerTotal]);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  เลขที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  เลขที่รับซื้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  ประเภทค่าบริการ
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  หมายเหตุ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  จำนวนเงิน
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {data.map((fee) => (
                <ServiceFeeRow key={fee.id} fee={fee} />
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  รวมทั้งหมด
                </td>
                <td className="px-6 py-4 text-right text-base font-bold text-amber-700 dark:text-amber-300">
                  {formattedFooterTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {categorySummary.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {categorySummary.map((summary) => (
            <CategoryCard key={summary.category} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
}

const ServiceFeeReportTable = memo(ServiceFeeReportTableComponent);
ServiceFeeReportTable.displayName = 'ServiceFeeReportTable';

export default ServiceFeeReportTable;
