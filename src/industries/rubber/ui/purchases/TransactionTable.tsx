'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { formatCurrency } from '@/shared/utils';
import { PurchaseTransaction } from './types';
import { TransactionActionButtons } from './TransactionActionButtons';

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
  isAdmin: boolean;
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

// Memoized row component to prevent unnecessary re-renders
interface TransactionRowProps {
  transaction: PurchaseTransaction;
  index: number;
  isAdmin: boolean;
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

const TransactionRow = memo<TransactionRowProps>(({
  transaction,
  index,
  isAdmin,
  onPrint,
  onDownloadPDF,
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

  return (
    <tr className={rowClassName}>
      <td className="px-3 py-3 text-sm font-medium text-blue-600 break-all dark:text-blue-400 xl:px-4">
        {transaction.purchaseNo}
      </td>
      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 xl:px-4">
        <div className="leading-tight">{formattedDate.date}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{formattedDate.time}</div>
      </td>
      <td className="px-3 py-3 text-sm text-gray-900 break-words dark:text-gray-100 xl:px-4">
        {memberDisplay}
      </td>
      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 xl:px-4">
        <div className="space-y-1">
          <div>{purchaseCountText}</div>
          {serviceFeeText && <div>{serviceFeeText}</div>}
        </div>
      </td>
      <td className="px-3 py-3 text-right text-xs font-semibold tabular-nums text-purple-600 break-words dark:text-purple-400 xl:px-4 xl:text-sm">
        {formattedAmount}
      </td>
      <td className="px-2 py-2 text-sm xl:px-3">
        <TransactionActionButtons
          transaction={transaction}
          isAdmin={isAdmin}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onDelete={handleDelete}
        />
      </td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';

const TransactionCard = memo<TransactionRowProps>(({
  transaction,
  isAdmin,
  onPrint,
  onDownloadPDF,
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

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-sm font-semibold text-blue-600 dark:text-blue-400">
            {transaction.purchaseNo}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
        isAdmin={isAdmin}
        layout="card"
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onDelete={handleDelete}
      />
    </article>
  );
});

TransactionCard.displayName = 'TransactionCard';

export const TransactionTable: React.FC<TransactionTableProps> = memo(({
  transactions,
  isAdmin,
  onPrint,
  onDownloadPDF,
  onDelete,
}) => {
  // Data is already sorted by the API; keep the incoming order
  const sortedTransactions = useMemo(() => transactions, [transactions]);

  // Memoize empty state
  const emptyState = useMemo(() => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
      <p className="text-gray-600 dark:text-gray-400">ไม่มีข้อมูลการรับซื้อ</p>
    </div>
  ), []);

  if (sortedTransactions.length === 0) {
    return emptyState;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {sortedTransactions.map((transaction, index) => (
          <TransactionCard
            key={transaction.purchaseNo}
            transaction={transaction}
            index={index}
            isAdmin={isAdmin}
            onPrint={onPrint}
            onDownloadPDF={onDownloadPDF}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:block">
        <table className="w-full table-fixed">
          <thead className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:border-gray-600 dark:from-gray-700 dark:to-gray-600">
            <tr>
              <th className="w-[16%] px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 xl:px-4">
                เลขที่รับซื้อ
              </th>
              <th className="w-[14%] px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 xl:px-4">
                วันที่
              </th>
              <th className="w-[22%] px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 xl:px-4">
                สมาชิก
              </th>
              <th className="w-[16%] px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 xl:px-4">
                รายการ
              </th>
              <th className="w-[14%] px-3 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 xl:px-4">
                ยอดรวม
              </th>
              <th className="w-[18%] px-2 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 xl:px-3">
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
                isAdmin={isAdmin}
                onPrint={onPrint}
                onDownloadPDF={onDownloadPDF}
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


