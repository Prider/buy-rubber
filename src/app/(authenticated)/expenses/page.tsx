'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExpenseListTable } from '@/components/expenses/ExpenseListTable';
import { MembersPagination } from '@/components/members/MembersPagination';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import { useRouter } from 'next/navigation';
import GamerLoader from '@/components/GamerLoader';

const ExpenseEntryCard = dynamic(
  () => import('@/components/expenses/ExpenseEntryCard').then((mod) => mod.ExpenseEntryCard),
  { ssr: false, loading: () => null },
);

export default function ExpensesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showConfirm } = useAlert();
  const { expenses, summary, loading, loadExpenses, createExpense, deleteExpense, pagination, changePage } = useExpenses();
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    // Add userId and userName to the expense data
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5 md:flex-row md:items-center md:justify-between">
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
              onClick={() => setIsFormOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 px-3 text-sm font-medium text-white shadow-md transition hover:from-primary-700 hover:via-purple-700 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:from-primary-500 dark:via-purple-500 dark:to-blue-500 md:min-h-10 md:shrink-0"
            >
              <span aria-hidden="true">+</span>
              บันทึกค่าใช้จ่าย
            </button>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-700 sm:grid-cols-3 sm:px-5">
            <div
              className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-3 py-2 text-white shadow-sm"
              tabIndex={0}
              role="group"
              aria-label="ค่าใช้จ่ายวันนี้"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="opacity-90">ค่าใช้จ่ายวันนี้</span>
                <span className="shrink-0 opacity-75">{summary.todayCount} รายการ</span>
              </div>
              <div className="mt-0.5 text-lg font-bold leading-tight tabular-nums">{summary.todayTotal.toLocaleString()} บาท</div>
            </div>

            <div
              className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-3 py-2 text-white shadow-sm"
              tabIndex={0}
              role="group"
              aria-label="ค่าใช้จ่ายเดือนนี้"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="opacity-90">ค่าใช้จ่ายเดือนนี้</span>
                <span className="shrink-0 opacity-75">{summary.monthCount} รายการ</span>
              </div>
              <div className="mt-0.5 text-lg font-bold leading-tight tabular-nums">{summary.monthTotal.toLocaleString()} บาท</div>
            </div>

            <div
              className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 px-3 py-2 text-white shadow-sm"
              tabIndex={0}
              role="group"
              aria-label="ค่าเฉลี่ยรายวัน"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="opacity-90">ค่าเฉลี่ยต่อวัน</span>
                <span className="shrink-0 opacity-75">เฉลี่ย {summary.avgCount} รายการ/วัน</span>
              </div>
              <div className="mt-0.5 text-lg font-bold leading-tight tabular-nums">{summary.avgDaily.toLocaleString()} บาท</div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <ExpenseListTable
              expenses={expenses}
              loading={loading}
              onDelete={handleDeleteExpense}
            />
          </div>

          <MembersPagination
            embedded
            pagination={{
              page: pagination.page,
              limit: pagination.pageSize,
              total: pagination.total,
              totalPages: pagination.totalPages,
              hasMore: pagination.page < pagination.totalPages,
            }}
            currentPage={pagination.page}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        </div>
      </div>

      {isFormOpen ? (
        <ExpenseEntryCard
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddExpense}
        />
      ) : null}
    </>
  );
}

