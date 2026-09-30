'use client';

import React, { useEffect, useState } from 'react';
import { ExpenseEntryCard } from '@/industries/rubber/ui/expenses/ExpenseEntryCard';
import { ExpenseListTable } from '@/industries/rubber/ui/expenses/ExpenseListTable';
import { Expense, useExpenses } from '@/industries/rubber/hooks/useExpenses';
import { useAuth } from '@/platform/AuthContext';
import { useAlert } from '@/shared/hooks/useAlert';
import { useRouter } from 'next/navigation';
import GamerLoader from '@/shared/ui/GamerLoader';

export default function ExpensesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showConfirm } = useAlert();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { expenses, summary, loading, loadExpenses, createExpense, updateExpense, deleteExpense, pagination, changePage } = useExpenses();

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    loadExpenses();
  }, [user, isLoading, router, loadExpenses]);

  const handleAddExpense = async (expenseData: { date: string; category: string; amount: number; description?: string }) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseData);
      return;
    }
    if (user) {
      await createExpense({
        ...expenseData,
        userId: user.id,
        userName: user.username,
      });
    } else {
      throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง');
    }
  };

  const openCreateForm = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const openEditForm = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    const confirmed = await showConfirm(
      'ยืนยันการลบค่าใช้จ่าย',
      'คุณต้องการลบค่าใช้จ่ายนี้หรือไม่?',
      {
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    await deleteExpense(id);
  };

  const handlePageChange = (pageNumber: number) => {
    changePage(pageNumber);
  };

  // Show loader while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[60vh] pb-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="hidden text-lg font-semibold tracking-tight sm:text-xl lg:block">
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                  บันทึกค่าใช้จ่าย
                </span>
              </h1>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                จัดการค่าใช้จ่ายประจำวันของกิจการ
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 md:min-h-10 md:shrink-0"
            >
              <span aria-hidden="true">+</span>
              เพิ่มค่าใช้จ่าย
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:grid-cols-3 sm:px-5">
            <div
              className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-md"
              tabIndex={0}
              role="group"
              aria-label="ค่าใช้จ่ายวันนี้"
            >
              <div className="text-xs opacity-90 sm:text-sm">ค่าใช้จ่ายวันนี้</div>
              <div className="mt-1 text-xl font-bold leading-tight sm:text-2xl">{summary.todayTotal.toLocaleString()} บาท</div>
              <div className="mt-0.5 text-xs opacity-75">{summary.todayCount} รายการ</div>
            </div>

            <div
              className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-md"
              tabIndex={0}
              role="group"
              aria-label="ค่าใช้จ่ายเดือนนี้"
            >
              <div className="text-xs opacity-90 sm:text-sm">ค่าใช้จ่ายเดือนนี้</div>
              <div className="mt-1 text-xl font-bold leading-tight sm:text-2xl">{summary.monthTotal.toLocaleString()} บาท</div>
              <div className="mt-0.5 text-xs opacity-75">{summary.monthCount} รายการ</div>
            </div>

            <div
              className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-4 text-white shadow-md"
              tabIndex={0}
              role="group"
              aria-label="ค่าเฉลี่ยรายวัน"
            >
              <div className="text-xs opacity-90 sm:text-sm">ค่าเฉลี่ยต่อวัน</div>
              <div className="mt-1 text-xl font-bold leading-tight sm:text-2xl">{summary.avgDaily.toLocaleString()} บาท</div>
              <div className="mt-0.5 text-xs opacity-75">เฉลี่ย {summary.avgCount} รายการ/วัน</div>
            </div>
          </div>

          <ExpenseListTable
            expenses={expenses}
            loading={loading}
            onEdit={openEditForm}
            onDelete={handleDeleteExpense}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {formOpen ? (
        <ExpenseEntryCard
          expenses={expenses}
          editingExpense={editingExpense}
          onSubmit={handleAddExpense}
          onClose={closeForm}
        />
      ) : null}
    </>
  );
}

