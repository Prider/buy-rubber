'use client';

import React, { memo, useMemo, useCallback, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { PurchaseTransaction } from './types';
import { TransactionActionButtons } from './TransactionActionButtons';

function PurchaseNoToggle({ pressed, onClick }: { pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={pressed ? 'ซ่อนเลขที่' : 'แสดงเลขที่'}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors ${
        pressed
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
          : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {pressed ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        )}
        {!pressed && (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        )}
      </svg>
      เลขที่
    </button>
  );
}

function formatCompactDateTime(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }).format(date),
    time: new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  };
}

interface TransactionTableProps {
  transactions: PurchaseTransaction[];
  canDelete: boolean;
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onEdit?: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

// Memoized row component to prevent unnecessary re-renders
interface TransactionRowProps {
  transaction: PurchaseTransaction;
  index: number;
  canDelete: boolean;
  showPurchaseNo: boolean;
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onEdit?: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

const TransactionRow = memo<TransactionRowProps>(({
  transaction,
  index,
  canDelete,
  showPurchaseNo,
  onPrint,
  onDownloadPDF,
  onEdit,
  onDelete,
}) => {
  const formattedDate = useMemo(
    () => formatCompactDateTime(transaction.date),
    [transaction.date]
  );

  // Memoize formatted amount
  const formattedAmount = useMemo(
    () => formatCurrency(transaction.totalAmount),
    [transaction.totalAmount]
  );

  // Memoize member display text
  const memberDisplay = useMemo(
    () => `${transaction.member.name} (${transaction.member.code})`,
    [transaction.member.name, transaction.member.code]
  );

  // Memoize purchase count text
  const purchaseCountText = useMemo(
    () => `รับซื้อ: ${transaction.purchases.length} รายการ`,
    [transaction.purchases.length]
  );

  // Memoize service fee count text
  const serviceFeeText = useMemo(
    () => transaction.serviceFees.length > 0 
      ? `ค่าบริการ: ${transaction.serviceFees.length} รายการ`
      : null,
    [transaction.serviceFees.length]
  );

  // Memoize row class names
  const rowClassName = useMemo(
    () => `hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
      index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'
    }`,
    [index]
  );

  // Memoize callbacks to prevent re-renders
  const handlePrint = useCallback(() => {
    onPrint(transaction);
  }, [transaction, onPrint]);

  const handleDownloadPDF = useCallback(() => {
    onDownloadPDF(transaction);
  }, [transaction, onDownloadPDF]);

  const handleDelete = useCallback(() => {
    onDelete(transaction);
  }, [transaction, onDelete]);

  const editHandler = onEdit && transaction.purchases.length > 0 ? onEdit : undefined;

  return (
    <tr className={rowClassName} data-purchase-no={transaction.purchaseNo}>
      <td className={showPurchaseNo ? 'break-all px-2 py-2 text-xs font-medium leading-tight text-blue-600 dark:text-blue-400' : 'px-2 py-2'}>
        {showPurchaseNo ? transaction.purchaseNo : null}
      </td>
      <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
        <div className="leading-tight">{formattedDate.date}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{formattedDate.time}</div>
      </td>
      <td className="break-words px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
        {memberDisplay}
      </td>
      <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="space-y-1">
          <div>{purchaseCountText}</div>
          {serviceFeeText && <div>{serviceFeeText}</div>}
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right text-xs font-semibold tabular-nums text-purple-600 dark:text-purple-400">
        {formattedAmount}
      </td>
      <td className="whitespace-nowrap px-1 py-2 text-right text-sm">
        <TransactionActionButtons
          transaction={transaction}
          canDelete={canDelete}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onEdit={editHandler}
          onDelete={handleDelete}
        />
      </td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';

const TransactionCard = memo<TransactionRowProps>(({
  transaction,
  canDelete,
  showPurchaseNo,
  onPrint,
  onDownloadPDF,
  onEdit,
  onDelete,
}) => {
  const formattedDate = useMemo(
    () => formatCompactDateTime(transaction.date),
    [transaction.date]
  );
  const formattedAmount = useMemo(
    () => formatCurrency(transaction.totalAmount),
    [transaction.totalAmount]
  );
  const memberDisplay = useMemo(
    () => `${transaction.member.name} (${transaction.member.code})`,
    [transaction.member.name, transaction.member.code]
  );
  const purchaseCountText = useMemo(
    () => `รับซื้อ: ${transaction.purchases.length} รายการ`,
    [transaction.purchases.length]
  );
  const serviceFeeText = useMemo(
    () => transaction.serviceFees.length > 0
      ? `ค่าบริการ: ${transaction.serviceFees.length} รายการ`
      : null,
    [transaction.serviceFees.length]
  );
  const handlePrint = useCallback(() => onPrint(transaction), [transaction, onPrint]);
  const handleDownloadPDF = useCallback(() => onDownloadPDF(transaction), [transaction, onDownloadPDF]);
  const handleDelete = useCallback(() => onDelete(transaction), [transaction, onDelete]);
  const editHandler = onEdit && transaction.purchases.length > 0 ? onEdit : undefined;

  return (
    <article
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      data-purchase-no={transaction.purchaseNo}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showPurchaseNo && (
            <p className="break-all text-sm font-semibold text-blue-600 dark:text-blue-400">
              {transaction.purchaseNo}
            </p>
          )}
          <p className={showPurchaseNo ? 'mt-0.5 text-xs text-gray-500 dark:text-gray-400' : 'text-sm font-medium text-gray-900 dark:text-gray-100'}>
            {formattedDate.date} · {formattedDate.time}
          </p>
        </div>
        <p className="shrink-0 text-right text-sm font-semibold text-purple-600 dark:text-purple-400">
          {formattedAmount}
        </p>
      </div>

      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-gray-900 dark:text-gray-100">
          {memberDisplay}
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{purchaseCountText}</p>
        {serviceFeeText ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{serviceFeeText}</p>
        ) : null}
      </div>

      <TransactionActionButtons
        transaction={transaction}
        canDelete={canDelete}
        layout="card"
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onEdit={editHandler}
        onDelete={handleDelete}
      />
    </article>
  );
});

TransactionCard.displayName = 'TransactionCard';

export const TransactionTable: React.FC<TransactionTableProps> = memo(({
  transactions,
  canDelete,
  onPrint,
  onDownloadPDF,
  onEdit,
  onDelete,
}) => {
  // Data is already sorted by the API; keep the incoming order
  const sortedTransactions = useMemo(() => transactions, [transactions]);
  const [showPurchaseNo, setShowPurchaseNo] = useState(false);
  const togglePurchaseNo = useCallback(() => setShowPurchaseNo((open) => !open), []);

  // Memoize empty state
  const emptyState = useMemo(() => (
    <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">ไม่มีข้อมูลการรับซื้อ</p>
  ), []);

  if (sortedTransactions.length === 0) {
    return emptyState;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 md:p-4 lg:hidden">
        <div className="md:col-span-2">
          <PurchaseNoToggle pressed={showPurchaseNo} onClick={togglePurchaseNo} />
        </div>
        {sortedTransactions.map((transaction, index) => (
          <TransactionCard
            key={transaction.purchaseNo}
            transaction={transaction}
            index={index}
            canDelete={canDelete}
            showPurchaseNo={showPurchaseNo}
            onPrint={onPrint}
            onDownloadPDF={onDownloadPDF}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden lg:block">
        <table className="w-full table-fixed">
          <thead className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:border-gray-600 dark:from-gray-700 dark:to-gray-600">
            <tr>
              <th
                style={{ width: showPurchaseNo ? '24%' : '10%' }}
                className="px-2 py-2 text-left align-bottom text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                <PurchaseNoToggle pressed={showPurchaseNo} onClick={togglePurchaseNo} />
              </th>
              <th
                style={{ width: showPurchaseNo ? '12%' : '14%' }}
                className="px-2 py-2 text-left align-bottom text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                วันที่
              </th>
              <th
                style={{ width: showPurchaseNo ? '14%' : '24%' }}
                className="px-2 py-2 text-left align-bottom text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                สมาชิก
              </th>
              <th
                style={{ width: showPurchaseNo ? '14%' : '16%' }}
                className="px-2 py-2 text-left align-bottom text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                รายการ
              </th>
              <th
                style={{ width: '7.25rem' }}
                className="whitespace-nowrap px-2 py-2 text-right align-bottom text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                ยอดรวม
              </th>
              <th
                style={{ width: onEdit ? '13rem' : '11.75rem' }}
                className="px-1 py-2 text-right align-bottom text-xs font-semibold text-gray-700 dark:text-gray-200"
              >
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {sortedTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.purchaseNo}
                transaction={transaction}
                index={index}
                canDelete={canDelete}
                showPurchaseNo={showPurchaseNo}
                onPrint={onPrint}
                onDownloadPDF={onDownloadPDF}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});

TransactionTable.displayName = 'TransactionTable';
