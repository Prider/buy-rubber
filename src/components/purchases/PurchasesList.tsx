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
      <div className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 lg:min-h-0 lg:flex-1">
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-600 lg:flex-row lg:items-center lg:gap-4">
        <h2 className="whitespace-nowrap text-base font-bold">
          <span className="animate-gradient bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
            ประวัติการรับซื้อทั้งหมด
          </span>
        </h2>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-10 text-sm shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 max-lg:min-h-11 max-lg:text-base dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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

          <div className="shrink-0">
            {resultCountDisplay}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-blue-600 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:from-blue-600 dark:to-indigo-700 sm:w-auto md:min-h-10"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto">
        <TransactionTable
          transactions={transactions}
          isAdmin={isAdmin}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
          onDelete={handleDelete}
        />
      </div>

      <PurchasesListPagination
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        embedded
      />
    </div>
  );
});

PurchasesList.displayName = 'PurchasesList';
