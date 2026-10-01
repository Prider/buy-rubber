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
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {loading && <span className="animate-pulse">กำลังค้นหา...</span>}
        {!loading && (
          <span>
            แสดง <span className="font-semibold text-blue-600 dark:text-blue-400">{transactions.length}</span> จาก {pagination.total} รายการ ในวัน 90 วัน
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
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Search Bar */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 p-4 sm:p-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="ค้นหารายการตามเลขที่รับซื้อ, ชื่อสมาชิก หรือรหัสสมาชิก..."
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="ล้างคำค้นหา"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="lg:shrink-0">
            {resultCountDisplay}
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
