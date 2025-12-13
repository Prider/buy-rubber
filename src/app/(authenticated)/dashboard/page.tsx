'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import RecentPurchasesList from '@/components/dashboard/RecentPurchasesList';
import TopMembersList from '@/components/dashboard/TopMembersList';
import RecentExpensesList from '@/components/dashboard/RecentExpensesList';
import GamerLoader from '@/components/GamerLoader';

export default function DashboardPage() {
  const router = useRouter();
  const { loading, stats, recentPurchases, topMembers, recentExpenses } = useDashboardData();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full min-h-0 overflow-hidden pb-4">
      {/* Header Section */}
      <div className="flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">แดชบอร์ด</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">ภาพรวมกิจการรับซื้อยาง</p>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="flex-shrink-0">
        <DashboardStatsCards stats={stats} />
      </div>

      {/* Today's Prices */}
      {/* <div className="flex-shrink-0">
        <TodayPricesCard productTypes={productTypes} todayPrices={todayPrices} />
      </div> */}

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 h-full min-h-0">
          <RecentPurchasesList purchases={recentPurchases} />
        </div>
        <div className="lg:col-span-1 h-full min-h-0">
          <RecentExpensesList expenses={recentExpenses} />
        </div>
        <div className="lg:col-span-1 h-full min-h-0">
          <TopMembersList topMembers={topMembers} />
        </div>
      </div>
    </div>
  );
}

