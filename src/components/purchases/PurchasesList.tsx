'use client';

import { GamerLoader } from '@/components/GamerLoader';
import { usePurchaseTransactions } from '@/hooks/usePurchaseTransactions';
import { useTransactionActions } from './hooks/useTransactionActions';
import { TransactionTable } from './TransactionTable';
import { PurchasesListPagination } from './PurchasesListPagination';

export const PurchasesList = () => {
  const {
    transactions,
    pagination,
    loading,
    error,
    setCurrentPage,
    refresh,
  } = usePurchaseTransactions(1);

  const {
    isAdmin,
    handlePrint,
    handleDownloadPDF,
    handleDelete,
  } = useTransactionActions({ onRefresh: refresh });

  if (loading) {
    return <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          รีเฟรช
        </button>
      </div>

      <TransactionTable
        transactions={transactions}
        isAdmin={isAdmin}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onDelete={handleDelete}
      />

      <PurchasesListPagination
        pagination={pagination}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};
