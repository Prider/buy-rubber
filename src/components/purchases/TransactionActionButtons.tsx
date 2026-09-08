'use client';

import React, { memo, useCallback } from 'react';
import { PurchaseTransaction } from './types';

interface TransactionActionButtonsProps {
  transaction: PurchaseTransaction;
  isAdmin: boolean;
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

export const TransactionActionButtons: React.FC<TransactionActionButtonsProps> = memo(({
  transaction,
  isAdmin,
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
  return (
    <div className="flex items-center justify-center space-x-3">
      <button
        onClick={handlePrint}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center space-x-1"
        title="พิมพ์"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        <span>พิมพ์</span>
      </button>

      <button
        onClick={handleDownloadPDF}
        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors flex items-center space-x-1"
        title="ดาวน์โหลด PDF"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <span>PDF</span>
      </button>

      {isAdmin && (
        <button
          onClick={handleDelete}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center space-x-1"
          title="ลบ"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>ลบ</span>
        </button>
      )}
    </div>
  );
});

TransactionActionButtons.displayName = 'TransactionActionButtons';
