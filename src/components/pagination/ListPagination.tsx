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

function visiblePageItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  const pages = new Set<number>([1, totalPages]);
  for (let pageNum = currentPage - 1; pageNum <= currentPage + 1; pageNum += 1) {
    if (pageNum >= 1 && pageNum <= totalPages) {
      pages.add(pageNum);
    }
  }

  const sorted = [...pages].sort((left, right) => left - right);
  const items: Array<number | 'ellipsis'> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const pageNum = sorted[index];
    const previous = sorted[index - 1];
    if (previous != null && pageNum - previous > 1) {
      items.push('ellipsis');
    }
    items.push(pageNum);
  }
  return items;
}

export function ListPagination({ pagination, loading = false, onPageChange }: ListPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const pageItems = visiblePageItems(pagination.page, pagination.totalPages);

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
            {pageItems.map((item, index) => {
              if (item === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-gray-500">
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  disabled={loading}
                  className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    pagination.page === item
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {item}
                </button>
              );
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
