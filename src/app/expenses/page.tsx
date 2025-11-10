'use client';

import Layout from '@/components/Layout';
import { ExpenseEntryCard } from '@/components/expenses/ExpenseEntryCard';
import { ExpenseListTable } from '@/components/expenses/ExpenseListTable';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { expenses, summary, loading, loadExpenses, createExpense, deleteExpense, pagination, changePage } = useExpenses();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadExpenses();
  }, [user, router, loadExpenses]);

  const handleAddExpense = async (expenseData: any) => {
    await createExpense(expenseData);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('คุณต้องการลบค่าใช้จ่ายนี้หรือไม่?')) {
      return;
    }
    await deleteExpense(id);
  };

  const handlePageChange = (pageNumber: number) => {
    changePage(pageNumber);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
        <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-2 py-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    บันทึกค่าใช้จ่าย
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    จัดการค่าใช้จ่ายประจำวันของกิจการ
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Entry Form */}
            <div className="lg:col-span-1">
              <ExpenseEntryCard onSubmit={handleAddExpense} />
            </div>

            {/* Right Column - List and Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Today's Total */}
                <div
                  className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                  tabIndex={0}
                  role="group"
                  aria-label="ค่าใช้จ่ายวันนี้"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-90">ค่าใช้จ่ายวันนี้</div>
                    <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{summary.todayTotal.toLocaleString()} บาท</div>
                  <div className="text-xs opacity-75 mt-1">{summary.todayCount} รายการ</div>
                </div>

                {/* This Month's Total */}
                <div
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                  tabIndex={0}
                  role="group"
                  aria-label="ค่าใช้จ่ายเดือนนี้"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-90">ค่าใช้จ่ายเดือนนี้</div>
                    <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{summary.monthTotal.toLocaleString()} บาท</div>
                  <div className="text-xs opacity-75 mt-1">{summary.monthCount} รายการ</div>
                </div>

                {/* Average Daily */}
                <div
                  className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                  tabIndex={0}
                  role="group"
                  aria-label="ค่าเฉลี่ยรายวัน"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-90">ค่าเฉลี่ยต่อวัน</div>
                    <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">{summary.avgDaily.toLocaleString()} บาท</div>
                  <div className="text-xs opacity-75 mt-1">เฉลี่ย {summary.avgCount} รายการ/วัน</div>
                </div>
              </div>

              {/* Expense List */}
              <ExpenseListTable 
                expenses={expenses} 
                loading={loading}
                onDelete={handleDeleteExpense}
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

