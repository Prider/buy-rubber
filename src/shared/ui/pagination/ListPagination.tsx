'use client';

import React from 'react';

export type ListPaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export interface ListPaginationProps {
  pagination: ListPaginationInfo;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function ListPagination({ pagination, loading = false, onPageChange }: ListPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const pageButton =
    'inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:min-h-9 sm:px-4';

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:mt-6">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
          แสดง {(pagination.page - 1) * pagination.limit + 1} -{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1 || loading}
            className={pageButton}
          >
            ก่อนหน้า
          </button>

          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300 sm:hidden">
            {pagination.page}/{pagination.totalPages}
          </span>

          <div className="hidden items-center gap-1 sm:flex">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
                    className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      pagination.page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                return (
                  <span key={pageNum} className="px-1 text-gray-500">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages || loading}
            className={pageButton}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
