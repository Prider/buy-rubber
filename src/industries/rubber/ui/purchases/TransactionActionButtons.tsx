'use client';

import React, { memo, useCallback } from 'react';
import { PurchaseTransaction } from './types';

interface TransactionActionButtonsProps {
  transaction: PurchaseTransaction;
  isAdmin: boolean;
  layout?: 'table' | 'card';
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

export const TransactionActionButtons: React.FC<TransactionActionButtonsProps> = memo(({
  transaction,
  isAdmin,
  layout = 'table',
  onPrint,
  onDownloadPDF,
  onDelete,
}) => {
  // Memoize callbacks to prevent unnecessary re-renders
  const handlePrint = useCallback(() => {
    onPrint(transaction);
  }, [transaction, onPrint]);

  const handleDownloadPDF = useCallback(() => {
    onDownloadPDF(transaction);
  }, [transaction, onDownloadPDF]);

  const handleDelete = useCallback(() => {
    onDelete(transaction);
  }, [transaction, onDelete]);
  const isCard = layout === 'card';
  const buttonClass = isCard
    ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
    : 'inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

  return (
    <div className={isCard ? 'flex gap-2' : 'flex flex-wrap items-center justify-end gap-1'}>
      <button
        type="button"
        onClick={handlePrint}
        className={`${buttonClass} text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30`}
        title="พิมพ์"
        aria-label="พิมพ์"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        <span className={isCard ? undefined : 'hidden xl:inline'}>พิมพ์</span>
      </button>

      <button
        type="button"
        onClick={handleDownloadPDF}
        className={`${buttonClass} text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30`}
        title="ดาวน์โหลด PDF"
        aria-label="PDF"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <span className={isCard ? undefined : 'hidden xl:inline'}>PDF</span>
      </button>

      {isAdmin && (
        <button
          type="button"
          onClick={handleDelete}
          className={`${buttonClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30`}
          title="ลบ"
          aria-label="ลบ"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span className={isCard ? undefined : 'hidden xl:inline'}>ลบ</span>
        </button>
      )}
    </div>
  );
});

TransactionActionButtons.displayName = 'TransactionActionButtons';
