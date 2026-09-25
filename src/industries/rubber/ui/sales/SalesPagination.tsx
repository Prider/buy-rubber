'use client';

import React, { useMemo } from 'react';
import { getVisiblePageNumbers } from '@/app/(authenticated)/sales/page.utils';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface SalesPaginationProps {
  pagination: PaginationInfo;
  loading: boolean;
  onPageChange: (page: number) => void;
  /** When true, render as footer inside SalesTable (no outer card / margin). */
  embedded?: boolean;
  /** Smaller footer when used with compact SalesTable. */
  compact?: boolean;
}

export default function SalesPagination({
  pagination,
  loading,
  onPageChange,
  embedded = false,
  compact = false,
}: SalesPaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(page, totalPages),
    [page, totalPages],
  );

  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const outerClass = embedded
    ? 'shrink-0 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
    : 'mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden';

  const innerClass =
    embedded && compact
      ? 'px-5 py-3 flex flex-wrap items-center justify-between gap-2.5'
      : 'px-6 py-4 flex flex-wrap items-center justify-between gap-3';

  const labelClass = 'text-sm text-gray-600 dark:text-gray-400';

  const navBtnClass =
    embedded && compact
      ? 'px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      : 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  const pageBtnClass =
    embedded && compact
      ? 'min-w-[34px] px-2 py-1 text-sm font-medium rounded-lg transition-colors'
      : 'min-w-[40px] px-4 py-2 text-sm font-medium rounded-lg transition-colors';

  return (
    <div className={outerClass}>
      <div className={innerClass}>
        <div className={labelClass}>
          แสดง {from} - {to} จาก {total} รายการ
        </div>

        <div className={`flex items-center ${embedded && compact ? 'gap-1.5' : 'gap-2'}`}>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className={navBtnClass}
          >
            ก่อนหน้า
          </button>

          <div className="flex items-center gap-1">
            {visiblePages.map((item, index) => {
              if (item === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className={embedded && compact ? 'px-1.5 text-sm text-gray-500' : 'px-2 text-gray-500'}
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  disabled={loading}
                  className={`${pageBtnClass} ${
                    page === item
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || loading}
            className={navBtnClass}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
