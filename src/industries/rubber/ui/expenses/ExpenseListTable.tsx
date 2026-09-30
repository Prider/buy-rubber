'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { Expense } from '@/industries/rubber/hooks/useExpenses';
import GamerLoader from '@/shared/ui/GamerLoader';
import { useAuth } from '@/platform/AuthContext';

interface ExpenseListTableProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void | Promise<void>;
}

export const ExpenseListTable: React.FC<ExpenseListTableProps> = memo(({
  expenses,
  loading,
  onEdit,
  onDelete,
  page,
  pageSize,
  total,
  onPageChange,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'root';
  const canEdit = isAdmin || user?.role === 'user';
  const showActions = canEdit || isAdmin;
  const desktopCols = showActions
    ? 'lg:grid-cols-[6.25rem_11rem_minmax(6.5rem,0.8fr)_minmax(0,1.1fr)_6.5rem_6.25rem_max-content]'
    : 'lg:grid-cols-[6.25rem_11rem_minmax(6.5rem,0.8fr)_minmax(0,1.1fr)_6.5rem_6.25rem]';
  // Memoize category icon function
  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'ค่าน้ำมัน':
        return '⛽';
      case 'ค่าซ่อมรถ':
        return '🔧';
      case 'ค่าคนงาน':
        return '👷';
      case 'อื่นๆ':
        return '📦';
      default:
        return '💰';
    }
  }, []);

  // Memoize format functions
  const formatCurrencyMemo = useCallback((amount: number) => {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatDateMemo = useCallback((dateString: string) => {
    // Parse the date string from the database
    // PostgreSQL stores dates in UTC, and when serialized to JSON they're ISO strings
    const date = new Date(dateString);
    
    // Format using browser's local timezone
    // This will correctly convert UTC times to the user's local timezone
    const dateStr = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    
    const timeStr = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    return `${dateStr} ${timeStr}`;
  }, []);

  // Sort expenses by date (newest first), then by createdAt if dates are equal
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // First sort by date (newest first)
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      
      // If dates are equal, sort by createdAt (most recently added first)
      const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdAtB - createdAtA;
    });
  }, [expenses]);

  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  const currentPage = Math.min(page, totalPages);
  const canGoPrev = !loading && currentPage > 1 && total > 0;
  const canGoNext = !loading && currentPage < totalPages && total > 0;
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return;
    }
    onPageChange(newPage);
  }, [totalPages, currentPage, onPageChange]);

  // Memoized row component
  interface ExpenseRowProps {
    expense: Expense;
    index: number;
    isAdmin: boolean;
    canEdit: boolean;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => Promise<void>;
  }

  const ExpenseRow = memo<ExpenseRowProps>(({ expense, index, isAdmin, canEdit, onEdit, onDelete }) => {
    // Memoize formatted values
    const formattedDate = useMemo(
      () => formatDateMemo(expense.date),
      [expense.date, formatDateMemo]
    );

    const formattedAmount = useMemo(
      () => formatCurrencyMemo(expense.amount),
      [expense.amount, formatCurrencyMemo]
    );

    const categoryIcon = useMemo(
      () => getCategoryIcon(expense.category),
      [expense.category]
    );

    const description = useMemo(
      () => expense.description || '-',
      [expense.description]
    );

    const userName = useMemo(
      () => expense.userName || '-',
      [expense.userName]
    );

    const handleDelete = useCallback(() => {
      onDelete(expense.id);
    }, [expense.id, onDelete]);

    const handleEdit = useCallback(() => {
      onEdit(expense);
    }, [expense, onEdit]);

    return (
      <div
        role="row"
        className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/80 lg:items-center lg:gap-0 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:bg-transparent lg:p-0 lg:hover:bg-gray-50 lg:dark:bg-transparent lg:dark:hover:bg-gray-700/30 ${desktopCols} ${
          index % 2 === 0 ? '' : 'lg:bg-gray-50/80 lg:dark:bg-gray-800/40'
        }`}
      >
        <span
          aria-hidden="true"
          className="row-span-5 flex h-10 w-10 items-center justify-center self-start rounded-full bg-orange-50 text-base dark:bg-orange-900/30 lg:hidden"
        >
          {categoryIcon}
        </span>

        <div role="cell" className="col-span-2 col-start-2 row-start-2 min-w-0 font-mono text-xs text-gray-500 dark:text-gray-400 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:px-3 lg:py-3 lg:text-sm lg:font-medium lg:text-gray-900 lg:dark:text-gray-100">
          {expense.expenseNo}
        </div>

        <div role="cell" className="col-start-3 row-start-1 text-right text-sm font-semibold text-red-600 dark:text-red-400 lg:col-start-6 lg:row-start-1 lg:px-3 lg:py-3">
          {formattedAmount}
        </div>

        <div role="cell" className="col-start-2 row-start-1 min-w-0 pr-2 text-sm font-semibold text-gray-900 dark:text-gray-100 lg:col-start-3 lg:row-start-1 lg:px-3 lg:py-3 lg:pr-3 lg:font-medium">
          <span className="hidden lg:mr-1 lg:inline" aria-hidden="true">{categoryIcon}</span>
          <span className="break-words">{expense.category}</span>
        </div>

        <div role="cell" className="col-span-2 col-start-2 row-start-3 text-xs text-gray-500 dark:text-gray-400 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:px-3 lg:py-3 lg:text-sm lg:text-gray-900 lg:dark:text-gray-100">
          {formattedDate}
        </div>

        <div role="cell" className="col-span-2 col-start-2 row-start-4 break-words text-sm text-gray-600 dark:text-gray-400 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:px-3 lg:py-3">
          {description}
        </div>

        <div role="cell" className="col-span-2 col-start-2 row-start-5 text-xs text-gray-500 dark:text-gray-400 lg:col-span-1 lg:col-start-5 lg:row-start-1 lg:px-3 lg:py-3 lg:text-sm lg:text-gray-700 lg:dark:text-gray-300">
          {userName}
        </div>

        {showActions ? (
          <div role="cell" className="col-span-3 row-start-6 mt-2 lg:col-span-1 lg:col-start-7 lg:row-start-1 lg:mt-0 lg:px-2 lg:py-2">
            <div className="flex flex-wrap gap-1 lg:flex-nowrap lg:justify-end">
              {canEdit ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-700 lg:min-h-8 lg:px-2"
                >
                  แก้ไข
                </button>
              ) : null}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30 lg:min-h-8 lg:px-2"
                  title="ลบ"
                >
                  ลบ
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  });

  ExpenseRow.displayName = 'ExpenseRow';

  if (loading) {
    return <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />;
  }

  if (expenses.length === 0) {
    return (
      <p className="px-4 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
        ยังไม่มีค่าใช้จ่าย
      </p>
    );
  }

  return (
    <div role="region" aria-label="ประวัติค่าใช้จ่าย">
      <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 dark:border-gray-700 dark:from-orange-900/30 dark:to-red-900/30 sm:px-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          ประวัติค่าใช้จ่าย
        </h3>
      </div>

      <div role="table" className="w-full text-sm">
        <div
          role="row"
          className={`hidden bg-gray-50 text-xs font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-300 lg:grid ${desktopCols}`}
        >
          <div role="columnheader" className="px-3 py-3 text-left">รหัส</div>
          <div role="columnheader" className="px-3 py-3 text-left">วันที่</div>
          <div role="columnheader" className="px-3 py-3 text-left">ประเภท</div>
          <div role="columnheader" className="px-3 py-3 text-left">รายละเอียด</div>
          <div role="columnheader" className="px-3 py-3 text-left">บันทึกโดย</div>
          <div role="columnheader" className="px-3 py-3 text-right">จำนวนเงิน</div>
          {showActions ? (
            <div role="columnheader" className="px-2 py-3 text-right">จัดการ</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 lg:block lg:p-0">
          {sortedExpenses.map((expense, index) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              index={index}
              isAdmin={isAdmin}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {total === 0
            ? 'ยังไม่มีข้อมูลค่าใช้จ่ายในระบบ'
            : `แสดง ${startItem.toLocaleString()}-${endItem.toLocaleString()} จาก ${total.toLocaleString()} รายการ`}
        </p>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrev}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors sm:min-h-9 ${
              canGoPrev
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                : 'cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500'
            }`}
          >
            ก่อนหน้า
          </button>
          <span className="text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300">
            หน้า {total === 0 ? 0 : currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors sm:min-h-9 ${
              canGoNext
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                : 'cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500'
            }`}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
});

ExpenseListTable.displayName = 'ExpenseListTable';


