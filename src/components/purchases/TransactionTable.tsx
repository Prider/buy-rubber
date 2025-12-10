'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { PurchaseTransaction } from './types';
import { TransactionActionButtons } from './TransactionActionButtons';

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
  // Memoize formatted date to avoid re-computation
  const formattedDate = useMemo(
    () => formatDateTime(new Date(transaction.date)),
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
      <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
        {transaction.purchaseNo}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
        {formattedDate}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
        {memberDisplay}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="space-y-1">
          <div>{purchaseCountText}</div>
          {serviceFeeText && <div>{serviceFeeText}</div>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
        {formattedAmount}
      </td>
      <td className="px-4 py-3 text-sm">
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

export const TransactionTable: React.FC<TransactionTableProps> = memo(({
  transactions,
  isAdmin,
  onPrint,
  onDownloadPDF,
  onDelete,
}) => {
  // Sort transactions by date (newest first) and then by createdAt (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      // Priority 1: Sort by createdAt if available (newest first)
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdAtA !== createdAtB) {
        return createdAtB - createdAtA; // Newest first
      }
      
      // Priority 2: Sort by date (newest first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Newest first
      }
      
      // Priority 3: Sort by purchaseNo (descending) as tiebreaker
      return b.purchaseNo.localeCompare(a.purchaseNo);
    });
  }, [transactions]);

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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                เลขที่รับซื้อ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                วันที่
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                สมาชิก
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                รายการ
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                ยอดรวม
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
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
    </div>
  );
});

TransactionTable.displayName = 'TransactionTable';


