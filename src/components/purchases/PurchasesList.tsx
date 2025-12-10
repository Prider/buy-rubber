'use client';

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { GamerLoader } from '@/components/GamerLoader';
import { usePurchaseTransactions } from '@/hooks/usePurchaseTransactions';
import { useTransactionActions } from './hooks/useTransactionActions';
import { TransactionTable } from './TransactionTable';
import { PurchasesListPagination } from './PurchasesListPagination';
import { useDebounce } from '@/hooks/useDebounce';

export interface PurchasesListRef {
  refresh: () => void;
}

export const PurchasesList = forwardRef<PurchasesListRef>((_, ref) => {
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
  } = usePurchaseTransactions(1);

  // Memoize refresh callback to prevent unnecessary re-renders
  const handleRefresh = useCallback(async () => {
    await loadTransactions(currentPage, debouncedSearchTerm || undefined);
  }, [currentPage, debouncedSearchTerm, loadTransactions]);

  const {
    isAdmin,
    handlePrint,
    handleDownloadPDF,
    handleDelete,
  } = useTransactionActions({ 
    onRefresh: handleRefresh
  });

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: () => {
      loadTransactions(currentPage, debouncedSearchTerm || undefined);
    },
  }), [currentPage, debouncedSearchTerm, loadTransactions]);

  // Memoize page change handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  // Memoize search clear handler
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Memoize search input change handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, setCurrentPage]);

  // Load transactions when page or debounced search changes
  useEffect(() => {
    loadTransactions(currentPage, debouncedSearchTerm || undefined);
  }, [currentPage, debouncedSearchTerm, loadTransactions]);

  // Memoize loading state component
  const loadingComponent = useMemo(
    () => <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />,
    []
  );

  // Memoize error state component
  const errorComponent = useMemo(
    () => (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    ),
    [error]
  );

  // Memoize result count display
  const resultCountDisplay = useMemo(
    () => (
      <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {loading && <span className="animate-pulse">กำลังค้นหา...</span>}
        {!loading && (
          <span>
            แสดง <span className="font-semibold text-blue-600 dark:text-blue-400">{transactions.length}</span> จาก {pagination.total} รายการ
          </span>
        )}
      </div>
    ),
    [loading, transactions.length, pagination.total]
  );

  if (loading && transactions.length === 0) {
    return loadingComponent;
  }

  if (error) {
    return errorComponent;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
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
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                  placeholder="ค้นหารายการตามเลขที่รับซื้อ, ชื่อสมาชิก หรือรหัสสมาชิก..."
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {resultCountDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <TransactionTable
        transactions={transactions}
        isAdmin={isAdmin}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      <PurchasesListPagination
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
      />
    </div>
  );
});

PurchasesList.displayName = 'PurchasesList';
