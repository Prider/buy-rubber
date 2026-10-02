'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import type { ChangeEvent } from 'react';
import SalesPagination from '@/components/sales/SalesPagination';
import {
  computeSaleProfitLoss,
  formatExpenseTypeLabel,
  type SaleExpenseApi,
} from '@/app/(authenticated)/sales/page.utils';

const PNL_EPS = 1e-6;

function saleDateParts(value: string): { date: string; time: string } | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }),
    time: d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function formatSaleDateTime(value: string): string {
  const parts = saleDateParts(value);
  if (!parts) return '–';
  return `${parts.date}, ${parts.time}`;
}

function SaleDateCell({ value }: { value: string }) {
  const parts = saleDateParts(value);
  if (!parts) return <>–</>;
  return (
    <>
      <span className="block">{parts.date}</span>
      <span className="block text-gray-500 dark:text-gray-400">{parts.time}</span>
    </>
  );
}

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
  expenses?: SaleExpenseApi[];
  sellingType: string;
  totalAmount: number;
  /** Cost/kg locked for this sale (ledger at sale time), not current stock avg. */
  unitCostPerKg?: number | null;
  /** COGS for this sale only. */
  costOfGoods?: number | null;
  profitLoss?: number | null;
}

function saleProfitLoss(row: Pick<SaleRow, 'profitLoss' | 'totalAmount' | 'costOfGoods'>): number | null {
  if (row.profitLoss != null && Number.isFinite(row.profitLoss)) return row.profitLoss;
  return computeSaleProfitLoss(row.totalAmount, row.costOfGoods);
}

/** Per-sale P/L cell — value must be for this row only (not product-level stock P/L). */
function SaleProfitLossCell({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-gray-400 dark:text-gray-500">–</span>;
  }

  const isGain = value > PNL_EPS;
  const isLoss = value < -PNL_EPS;
  const cls = isGain
    ? 'text-green-600 dark:text-green-400 font-semibold tabular-nums'
    : isLoss
      ? 'text-red-600 dark:text-red-400 font-semibold tabular-nums'
      : 'text-gray-600 dark:text-gray-400 tabular-nums';
  const prefix = isGain ? '+' : '';

  return (
    <span className={cls}>
      {prefix}
      {formatCurrency(value)}
    </span>
  );
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
  editingSaleId?: string | null;
  deletingSaleId?: string | null;
  onEdit?: (row: SaleRow) => void | Promise<void>;
  onDelete?: (saleId: string) => void;
  onAddSale?: () => void;
  onRecordDelivery?: () => void;
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
  editingSaleId = null,
  deletingSaleId = null,
  onEdit,
  onDelete,
  onAddSale,
  onRecordDelivery,
}: SalesTableProps) {
  const headPad = compact ? 'px-4 py-4 min-h-[3.25rem]' : 'px-6 py-5 min-h-[4rem]';
  const titleClass = compact
    ? 'text-base font-bold text-gray-900 dark:text-white'
    : 'text-xl font-bold text-gray-900 dark:text-white';
  const cellPad = compact
    ? 'px-1.5 py-2 align-top leading-snug xl:px-2'
    : 'px-2 py-2.5 align-top leading-snug';
  const textCell = `${cellPad} whitespace-normal break-words`;
  const numCell = `${cellPad} whitespace-nowrap text-right text-[11px] tabular-nums`;
  const tableText = compact ? 'text-[11px] xl:text-xs' : 'text-xs';

  const inputPadY = compact ? 'py-2.5' : 'py-3';
  const inputText = compact ? 'text-sm' : 'text-base';
  const searchPlaceholder = 'ค้นหารายการขายตามเลขที่ขาย หรือชื่อบริษัท หรือประเภทสินค้า...';

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 lg:min-h-0 lg:flex-1">
      <div
        className={`flex shrink-0 flex-col gap-3 border-b border-gray-200 dark:border-gray-600 lg:flex-row lg:items-center lg:gap-4 ${headPad}`}
      >
        <h2 className={`${titleClass} whitespace-nowrap`}>ประวัติการขาย</h2>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {onSearchChange && (
          <>
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
                className={`w-full pl-10 pr-10 ${inputPadY} border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 max-lg:min-h-11 max-lg:text-base ${inputText} transition-all duration-200 shadow-sm`}
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
          </>
        )}

        {onRecordDelivery || onAddSale ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            {onRecordDelivery ? (
              <button
                type="button"
                data-testid="sales-open-delivery"
                onClick={onRecordDelivery}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50 sm:w-auto md:min-h-10"
              >
                บันทึกการนำส่ง
              </button>
            ) : null}
            {onAddSale ? (
              <button
                type="button"
                data-testid="sales-open-form"
                onClick={onAddSale}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 animate-gradient dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 sm:w-auto md:min-h-10"
              >
                <span aria-hidden="true">+</span>
                บันทึกการขาย
              </button>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto">
        <div className="lg:hidden">
          {sales.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูลการขาย</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 p-3 md:p-4">
              {sales.map((row) => {
                const profitLoss = saleProfitLoss(row);
                const expenseLabel = formatExpenseTypeLabel(row.expenseType, row.expenses);
                const showExpense = expenseLabel !== '-' || row.expenseCost != null || Boolean(row.expenseNote);
                const editing = editingSaleId === row.id;

                return (
                  <li
                    key={row.id}
                    className={`w-full rounded-2xl border p-3 ${
                      editing
                        ? 'border-violet-300 bg-violet-50/70 ring-1 ring-violet-200 dark:border-violet-500 dark:bg-violet-950/20 dark:ring-violet-500/30'
                        : 'border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatSaleDateTime(row.date)}</p>
                        <p className="mt-0.5 truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                          {row.companyName}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                          {row.productType?.name || '-'} · {row.sellingType}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {row.saleNo}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-white px-2.5 py-2 dark:bg-gray-800">
                        <dt className="text-[11px] text-gray-500 dark:text-gray-400">น้ำหนัก</dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {formatNumber(row.weight)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white px-2.5 py-2 dark:bg-gray-800">
                        <dt className="text-[11px] text-gray-500 dark:text-gray-400">%ยาง</dt>
                        <dd className="mt-0.5 text-sm tabular-nums text-gray-900 dark:text-gray-100">
                          {row.rubberPercent != null ? formatNumber(row.rubberPercent) : '-'}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white px-2.5 py-2 dark:bg-gray-800">
                        <dt className="text-[11px] text-gray-500 dark:text-gray-400">ราคา/กก.</dt>
                        <dd className="mt-0.5 text-sm tabular-nums text-gray-900 dark:text-gray-100">
                          {formatNumber(row.pricePerUnit)}
                        </dd>
                      </div>
                    </dl>

                    {showExpense ? (
                      <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-gray-500 dark:text-gray-400">
                            {expenseLabel === '-' ? 'ค่าใช้จ่าย' : expenseLabel}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {row.expenseCost != null ? formatNumber(row.expenseCost) : '-'}
                          </span>
                        </div>
                        {row.expenseNote ? (
                          <p className="break-words text-xs text-gray-500 dark:text-gray-400">{row.expenseNote}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-gray-200/80 pt-3 dark:border-gray-700">
                      <div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">ยอดรวม</p>
                        <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {formatCurrency(row.totalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">กำไร/ขาดทุน</p>
                        <SaleProfitLossCell value={profitLoss} />
                      </div>
                    </div>

                    {(onEdit || onDelete) && (
                      <div className="mt-3 flex gap-2">
                        {onEdit ? (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            disabled={Boolean(deletingSaleId)}
                            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-sm font-medium transition-colors ${
                              editing
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                            } disabled:opacity-50`}
                          >
                            {editing ? 'ยกเลิกแก้ไข' : 'แก้ไข'}
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(row.id)}
                            disabled={Boolean(deletingSaleId)}
                            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-red-100 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
                          >
                            {deletingSaleId === row.id ? 'กำลังลบ...' : 'ลบ'}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="hidden lg:block">
        <table className={`w-full table-fixed ${tableText}`}>
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className={`${textCell} w-[7%] text-left`}>วันที่ / เวลา</th>
              <th className={`${textCell} w-[9%] text-left`}>เลขที่</th>
              <th className={`${textCell} w-[7.5%] text-left`}>บริษัท</th>
              <th className={`${textCell} w-[7%] text-left`}>ประเภทสินค้า</th>
              <th className={`${textCell} w-[8%] text-right`}>น้ำหนัก</th>
              <th className={`${textCell} w-[4.5%] text-right`}>%ยาง</th>
              <th className={`${textCell} w-[6.5%] text-right`}>ราคา</th>
              <th className={`${textCell} w-[7%] text-left`}>ชนิดค่าใช้จ่าย</th>
              <th className={`${textCell} w-[7%] text-right`}>ค่าใช้จ่าย</th>
              <th className={`${textCell} w-[7%] text-left`}>หมายเหตุค่าใช้จ่าย</th>
              <th className={`${textCell} w-[5.5%] text-left`}>รูปแบบขาย</th>
              <th className={`${textCell} w-[9%] text-right`}>ยอดรวม</th>
              <th className={`${textCell} w-[9.5%] text-right`} title="กำไร/ขาดทุนของรายการขายนี้เท่านั้น">
                กำไร/ขาดทุน
              </th>
              {(onEdit || onDelete) && <th className={`${textCell} w-[5.5%] text-center`}>จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={onEdit || onDelete ? 14 : 13} className={`${textCell} py-8 text-center text-gray-500`}>
                  ยังไม่มีข้อมูลการขาย
                </td>
              </tr>
            ) : (
              sales.map((row) => {
                // Prefer API field; recompute from this row's COGS so P/L stays per-transaction.
                const profitLoss = saleProfitLoss(row);

                return (
                <tr
                  key={row.id}
                  className={`${
                    editingSaleId === row.id
                      ? 'border-y border-violet-300 dark:border-violet-500'
                      : 'border-t border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <td className={textCell}>
                    <SaleDateCell value={row.date} />
                  </td>
                  <td className={`${textCell} break-all`}>{row.saleNo}</td>
                  <td className={textCell}>{row.companyName}</td>
                  <td className={textCell}>{row.productType?.name || '-'}</td>
                  <td className={numCell}>{formatNumber(row.weight)}</td>
                  <td className={numCell}>{row.rubberPercent != null ? formatNumber(row.rubberPercent) : '-'}</td>
                  <td className={numCell}>{formatNumber(row.pricePerUnit)}</td>
                  <td className={textCell}>{formatExpenseTypeLabel(row.expenseType, row.expenses)}</td>
                  <td className={numCell}>{row.expenseCost != null ? formatNumber(row.expenseCost) : '-'}</td>
                  <td className={textCell}>{row.expenseNote || '-'}</td>
                  <td className={textCell}>{row.sellingType}</td>
                  <td className={`${numCell} font-semibold`}>{formatCurrency(row.totalAmount)}</td>
                  <td className={numCell}>
                    <SaleProfitLossCell value={profitLoss} />
                  </td>
                  {(onEdit || onDelete) && (
                    <td className={`${textCell} text-center`}>
                      <div className="flex flex-col items-stretch gap-1">
                        {onEdit ? (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            disabled={Boolean(deletingSaleId)}
                            className={`w-full whitespace-normal rounded-md px-1 py-1 text-xs font-medium leading-tight transition-colors ${
                              editingSaleId === row.id
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                            } disabled:opacity-50`}
                          >
                            {editingSaleId === row.id ? 'ยกเลิกแก้ไข' : 'แก้ไข'}
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(row.id)}
                            disabled={Boolean(deletingSaleId)}
                            className="w-full whitespace-normal rounded-md bg-red-100 px-1 py-1 text-xs font-medium leading-tight text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
                          >
                            {deletingSaleId === row.id ? 'กำลังลบ...' : 'ลบ'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
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

