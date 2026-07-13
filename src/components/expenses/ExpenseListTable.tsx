'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { Expense } from '@/hooks/useExpenses';
import GamerLoader from '@/components/GamerLoader';
import { useAuth } from '@/contexts/AuthContext';

interface ExpenseListTableProps {
  expenses: Expense[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void | Promise<void>;
}

export const ExpenseListTable: React.FC<ExpenseListTableProps> = memo(({
  expenses,
  loading,
  onDelete,
  page,
  pageSize,
  total,
  onPageChange,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'root';
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
    onDelete: (id: string) => Promise<void>;
  }

  const ExpenseRow = memo<ExpenseRowProps>(({ expense, index, isAdmin, onDelete }) => {
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

    // Memoize row class
    const rowClassName = useMemo(
      () => `hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
      }`,
      [index]
    );

    // Memoize delete handler
    const handleDelete = useCallback(() => {
      onDelete(expense.id);
    }, [expense.id, onDelete]);

    return (
      <tr className={rowClassName}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          {expense.expenseNo}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
          {formattedDate}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
          <span className="inline-flex items-center space-x-1">
            <span>{categoryIcon}</span>
            <span>{expense.category}</span>
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          <span className="inline-flex items-center space-x-1.5">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">{userName}</span>
          </span>
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 text-right">
          {formattedAmount}
        </td>
        {isAdmin && (
          <td className="px-4 py-3 text-center">
            <button
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              title="ลบ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </td>
        )}
      </tr>
    );
  });

  ExpenseRow.displayName = 'ExpenseRow';

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="py-10">
          <GamerLoader message="กำลังโหลดข้อมูล..." />
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">📭 ยังไม่มีค่าใช้จ่าย</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">เริ่มบันทึกค่าใช้จ่ายเพื่อดูประวัติในที่นี้</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      tabIndex={0}
      role="region"
      aria-label="ประวัติค่าใช้จ่าย"
    >
      <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          ประวัติค่าใช้จ่าย
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                รหัส
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                วันที่
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                ประเภท
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                รายละเอียด
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                บันทึกโดย
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                จำนวนเงิน
              </th>
              {isAdmin && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  จัดการ
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {sortedExpenses.map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                index={index}
                isAdmin={isAdmin}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {total === 0
            ? 'ยังไม่มีข้อมูลค่าใช้จ่ายในระบบ'
            : `แสดง ${startItem.toLocaleString()}-${endItem.toLocaleString()} จาก ${total.toLocaleString()} รายการ`}
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrev}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
              canGoPrev
                ? 'text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
            }`}
          >
            ก่อนหน้า
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            หน้า {total === 0 ? 0 : currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
              canGoNext
                ? 'text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed'
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


