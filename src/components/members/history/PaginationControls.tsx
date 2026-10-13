'use client';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev?: () => void;
  onNext?: () => void;
  onPageChange?: (page: number) => void;
  /** Render as a footer inside a parent card. */
  embedded?: boolean;
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

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onPageChange,
  embedded = false,
}: PaginationControlsProps) => {
  const pageItems = onPageChange ? visiblePageItems(currentPage, totalPages) : [];
  const outerClass = embedded
    ? 'flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800 sm:flex-row'
    : 'mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700 sm:flex-row';

  return (
    <div className={outerClass}>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        หน้า <span className="font-semibold text-gray-900 dark:text-gray-100">{currentPage}</span> จาก{' '}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPages}</span>
      </div>
      {onPageChange ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          {pageItems.map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
                  …
                </span>
              );
            }

            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                disabled={item === currentPage}
                className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-default ${
                  item === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            ← ก่อนหน้า
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
};
