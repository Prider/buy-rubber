'use client';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export const PaginationControls = ({ currentPage, totalPages, onPrev, onNext }: PaginationControlsProps) => (
  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
    <div className="text-sm text-gray-600 dark:text-gray-400">
      หน้า <span className="font-semibold text-gray-900 dark:text-gray-100">{currentPage}</span> จาก{' '}
      <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPages}</span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50.dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ← ก่อนหน้า
      </button>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm.font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ถัดไป →
      </button>
    </div>
  </div>
);

