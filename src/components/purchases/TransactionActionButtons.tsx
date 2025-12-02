'use client';

import React from 'react';
import { PurchaseTransaction } from './types';

interface TransactionActionButtonsProps {
  transaction: PurchaseTransaction;
  isAdmin: boolean;
  onPrint: (transaction: PurchaseTransaction) => void;
  onDownloadPDF: (transaction: PurchaseTransaction) => void;
  onDelete: (transaction: PurchaseTransaction) => void;
}

export const TransactionActionButtons: React.FC<TransactionActionButtonsProps> = ({
  transaction,
  isAdmin,
  onPrint,
  onDownloadPDF,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPrint(transaction)}
        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
        title="พิมพ์"
      >
        พิมพ์
      </button>
      <button
        onClick={() => onDownloadPDF(transaction)}
        className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs"
        title="ดาวน์โหลด PDF"
      >
        PDF
      </button>
      {isAdmin && (
        <button
          onClick={() => onDelete(transaction)}
          className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs"
          title="ลบ"
        >
          ลบ
        </button>
      )}
    </div>
  );
};

