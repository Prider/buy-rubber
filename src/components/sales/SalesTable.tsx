'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import SalesPagination from '@/components/sales/SalesPagination';

interface SaleRow {
  id: string;
  saleNo: string;
  date: string;
  companyName: string;
  productTypeId: string;
  productType?: { name: string; code: string };
  weight: number;
  rubberPercent: number | null;
  pricePerUnit: number;
  expenseType: string | null;
  expenseCost: number | null;
  expenseNote: string | null;
  sellingType: string;
  totalAmount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface SalesTableProps {
  sales: SaleRow[];
  pagination: PaginationInfo;
  loading?: boolean;
  onPageChange: (page: number) => void;
  /** Tighter chrome to fit viewport without page scroll. */
  compact?: boolean;
}

export default function SalesTable({
  sales,
  pagination,
  loading = false,
  onPageChange,
  compact = false,
}: SalesTableProps) {
  const headPad = compact ? 'px-4 py-4 min-h-[3.25rem]' : 'px-6 py-5 min-h-[4rem]';
  const titleClass = compact
    ? 'text-base font-bold text-gray-900 dark:text-white'
    : 'text-xl font-bold text-gray-900 dark:text-white';
  const cellPad = compact ? 'px-2.5 py-2' : 'px-3 py-2.5';
  const tableText = compact ? 'text-sm' : 'text-base';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div
        className={`flex shrink-0 items-center border-b border-gray-200 dark:border-gray-600 ${headPad}`}
      >
        <h2 className={titleClass}>ตารางรายการขาย</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className={`w-full ${tableText}`}>
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className={`${cellPad} text-left`}>วันที่</th>
              <th className={`${cellPad} text-left`}>เลขที่</th>
              <th className={`${cellPad} text-left`}>บริษัท</th>
              <th className={`${cellPad} text-left`}>ประเภทสินค้า</th>
              <th className={`${cellPad} text-right`}>น้ำหนัก</th>
              <th className={`${cellPad} text-right`}>%ยาง</th>
              <th className={`${cellPad} text-right`}>ราคา</th>
              <th className={`${cellPad} text-left`}>ชนิดค่าใช้จ่าย</th>
              <th className={`${cellPad} text-right`}>ค่าใช้จ่าย</th>
              <th className={`${cellPad} text-left`}>หมายเหตุค่าใช้จ่าย</th>
              <th className={`${cellPad} text-left`}>รูปแบบขาย</th>
              <th className={`${cellPad} text-right`}>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={12} className={`${cellPad} py-8 text-center text-gray-500`}>
                  ยังไม่มีข้อมูลการขาย
                </td>
              </tr>
            ) : (
              sales.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className={cellPad}>{new Date(row.date).toLocaleDateString('th-TH')}</td>
                  <td className={cellPad}>{row.saleNo}</td>
                  <td className={cellPad}>{row.companyName}</td>
                  <td className={cellPad}>{row.productType?.name || '-'}</td>
                  <td className={`${cellPad} text-right`}>{formatNumber(row.weight)}</td>
                  <td className={`${cellPad} text-right`}>{row.rubberPercent != null ? formatNumber(row.rubberPercent) : '-'}</td>
                  <td className={`${cellPad} text-right`}>{formatNumber(row.pricePerUnit)}</td>
                  <td className={cellPad}>{row.expenseType || '-'}</td>
                  <td className={`${cellPad} text-right`}>{row.expenseCost != null ? formatNumber(row.expenseCost) : '-'}</td>
                  <td className={cellPad}>{row.expenseNote || '-'}</td>
                  <td className={cellPad}>{row.sellingType}</td>
                  <td className={`${cellPad} text-right font-semibold`}>{formatCurrency(row.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <SalesPagination
        pagination={pagination}
        loading={loading}
        onPageChange={onPageChange}
        embedded
        compact={compact}
      />
    </div>
  );
}

