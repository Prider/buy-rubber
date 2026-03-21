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
}

export default function SalesTable({
  sales,
  pagination,
  loading = false,
  onPageChange,
}: SalesTableProps) {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-h-0">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 shrink-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ตารางรายการขาย</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">วันที่</th>
              <th className="px-3 py-2 text-left">เลขที่</th>
              <th className="px-3 py-2 text-left">บริษัท</th>
              <th className="px-3 py-2 text-left">ประเภทสินค้า</th>
              <th className="px-3 py-2 text-right">น้ำหนัก</th>
              <th className="px-3 py-2 text-right">%ยาง</th>
              <th className="px-3 py-2 text-right">ราคา</th>
              <th className="px-3 py-2 text-left">ชนิดค่าใช้จ่าย</th>
              <th className="px-3 py-2 text-right">ค่าใช้จ่าย</th>
              <th className="px-3 py-2 text-left">หมายเหตุค่าใช้จ่าย</th>
              <th className="px-3 py-2 text-left">รูปแบบขาย</th>
              <th className="px-3 py-2 text-right">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-gray-500">
                  ยังไม่มีข้อมูลการขาย
                </td>
              </tr>
            ) : (
              sales.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2">{new Date(row.date).toLocaleDateString('th-TH')}</td>
                  <td className="px-3 py-2">{row.saleNo}</td>
                  <td className="px-3 py-2">{row.companyName}</td>
                  <td className="px-3 py-2">{row.productType?.name || '-'}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(row.weight)}</td>
                  <td className="px-3 py-2 text-right">{row.rubberPercent != null ? formatNumber(row.rubberPercent) : '-'}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(row.pricePerUnit)}</td>
                  <td className="px-3 py-2">{row.expenseType || '-'}</td>
                  <td className="px-3 py-2 text-right">{row.expenseCost != null ? formatNumber(row.expenseCost) : '-'}</td>
                  <td className="px-3 py-2">{row.expenseNote || '-'}</td>
                  <td className="px-3 py-2">{row.sellingType}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatCurrency(row.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <SalesPagination pagination={pagination} loading={loading} onPageChange={onPageChange} embedded />
    </div>
  );
}

