'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ChangeEvent } from 'react';
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
  // Search UI (similar to PurchasesList)
  searchTerm?: string;
  onSearchChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearSearch?: () => void;
}

export default function SalesTable({
  sales,
  pagination,
  loading = false,
  onPageChange,
  compact = false,
  searchTerm = '',
  onSearchChange,
  onClearSearch,
}: SalesTableProps) {
  const headPad = compact ? 'px-4 py-4 min-h-[3.25rem]' : 'px-6 py-5 min-h-[4rem]';
  const titleClass = compact
    ? 'text-base font-bold text-gray-900 dark:text-white'
    : 'text-xl font-bold text-gray-900 dark:text-white';
  const cellPad = compact ? 'px-2.5 py-2' : 'px-3 py-2.5';
  const tableText = compact ? 'text-sm' : 'text-base';

  const inputPadY = compact ? 'py-2.5' : 'py-3';
  const inputText = compact ? 'text-sm' : 'text-base';
  const searchPlaceholder = 'ค้นหารายการขายตามเลขที่ขาย หรือชื่อบริษัท หรือประเภทสินค้า...';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div
        className={`flex shrink-0 items-center gap-4 border-b border-gray-200 dark:border-gray-600 ${headPad}`}
      >
        <h2 className={`${titleClass} whitespace-nowrap`}>ตารางรายการขาย</h2>

        {onSearchChange && (
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="relative min-w-0 flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={onSearchChange}
                className={`w-full pl-10 pr-10 ${inputPadY} border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 ${inputText} transition-all duration-200 shadow-sm`}
                placeholder={searchPlaceholder}
              />

              {searchTerm && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="ล้างข้อความค้นหา"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="shrink-0">
              {loading ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  <span className="animate-pulse">กำลังค้นหา...</span>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  แสดง{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{sales.length}</span> จาก{' '}
                  {pagination.total} รายการ
                </div>
              )}
            </div>
          </div>
        )}
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

