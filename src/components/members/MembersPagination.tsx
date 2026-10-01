import { PaginationInfo } from '@/types/member';

interface MembersPaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  embedded?: boolean;
}

export const MembersPagination = ({
  pagination,
  currentPage,
  onPageChange,
  isLoading,
  embedded = false,
}: MembersPaginationProps) => {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  const pageButton =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:min-h-9 sm:min-w-9 sm:rounded-lg';

  return (
    <div
      className={
        embedded
          ? 'border-t border-gray-100 dark:border-gray-700'
          : 'mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'
      }
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          แสดง {startItem}–{endItem} จาก {pagination.total}
        </p>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={pagination.page === 1 || isLoading}
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
                    disabled={isLoading}
                    className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      pagination.page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                return (
                  <span key={pageNum} className="px-1 text-gray-400">
                    …
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className={pageButton}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
};
