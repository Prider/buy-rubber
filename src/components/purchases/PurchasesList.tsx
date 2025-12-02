'use client';

import { useState, useEffect } from 'react';
import { GamerLoader } from '@/components/GamerLoader';
import { usePurchaseTransactions } from '@/hooks/usePurchaseTransactions';
import { useTransactionActions } from './hooks/useTransactionActions';
import { TransactionTable } from './TransactionTable';
import { PurchasesListPagination } from './PurchasesListPagination';
import { useDebounce } from '@/hooks/useDebounce';

export const PurchasesList = () => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const {
    transactions,
    pagination,
    loading,
    error,
    currentPage,
    setCurrentPage,
    loadTransactions,
    refresh,
  } = usePurchaseTransactions(1);

  const {
    isAdmin,
    handlePrint,
    handleDownloadPDF,
    handleDelete,
  } = useTransactionActions({ onRefresh: () => refresh(debouncedSearchTerm) });

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, setCurrentPage]);

  // Load transactions when page or debounced search changes
  useEffect(() => {
    loadTransactions(currentPage, debouncedSearchTerm || undefined);
  }, [currentPage, debouncedSearchTerm, loadTransactions]);

  if (loading && transactions.length === 0) {
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
      {/* Search Bar */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                    placeholder="ค้นหารายการตามเลขที่รับซื้อ, ชื่อสมาชิก หรือรหัสสมาชิก..."
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {loading && <span className="animate-pulse">กำลังค้นหา...</span>}
                  {!loading && (
                    <span>
                      แสดง <span className="font-semibold text-blue-600 dark:text-blue-400">{transactions.length}</span> จาก {pagination.total} รายการ
                    </span>
                  )}
                </div>
                <button
                  onClick={refresh}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  รีเฟรช
                </button>
              </div>
            </div>
          </div>
        </div>
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
