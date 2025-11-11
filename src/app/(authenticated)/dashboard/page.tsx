'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import RecentPurchasesList from '@/components/dashboard/RecentPurchasesList';
import TopMembersList from '@/components/dashboard/TopMembersList';
import RecentExpensesList from '@/components/dashboard/RecentExpensesList';
import TodayPricesCard from '@/components/dashboard/TodayPricesCard';

export default function DashboardPage() {
  const router = useRouter();
  const { loading, stats, todayPrices, productTypes, recentPurchases, topMembers, recentExpenses } = useDashboardData();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"></div>
          <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full min-h-0 overflow-hidden pb-4">
      {/* Header Section */}
      <div className="space-y-2 flex-shrink-0">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">แดชบอร์ด</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">ภาพรวมกิจการรับซื้อยาง</p>
      </div>
      {/* Stats Cards */}
      <div className="flex-shrink-0">
        <DashboardStatsCards stats={stats} />
      </div>

      {/* Today's Prices */}
      <div className="flex-shrink-0">
        <TodayPricesCard productTypes={productTypes} todayPrices={todayPrices} />
      </div>

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

