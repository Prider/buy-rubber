'use client';

import React from 'react';
import { PaginationInfo } from './types';

interface PurchasesListPaginationProps {
  pagination: PaginationInfo;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export const PurchasesListPagination: React.FC<PurchasesListPaginationProps> = ({
  pagination,
  loading,
  onPageChange,
}) => {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          แสดง {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ก่อนหน้า
          </button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show first page, last page, current page, and pages around current
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
                    className={`min-w-[40px] px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === pagination.page - 2 ||
                pageNum === pagination.page + 2
              ) {
                return <span key={pageNum} className="px-2 text-gray-500">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
};

