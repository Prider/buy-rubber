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

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          แสดง {(pagination.page - 1) * pagination.limit + 1} -{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1 || loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            ก่อนหน้า
          </button>

          <div className="flex items-center gap-1">
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
                    className={`min-w-[40px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                return (
                  <span key={pageNum} className="px-2 text-gray-500">
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
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
