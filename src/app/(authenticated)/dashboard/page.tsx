'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/industries/rubber/hooks/useDashboardData';
import DashboardStatsCards from '@/industries/rubber/ui/dashboard/DashboardStatsCards';
import RecentPurchasesList from '@/industries/rubber/ui/dashboard/RecentPurchasesList';
import RecentSalesList from '@/industries/rubber/ui/dashboard/RecentSalesList';
import TopMembersList from '@/industries/rubber/ui/dashboard/TopMembersList';
import RecentExpensesList from '@/industries/rubber/ui/dashboard/RecentExpensesList';
import AssistantPanel from '@/industries/rubber/ui/assistant/AssistantPanel';
import GamerLoader from '@/shared/ui/GamerLoader';

export default function DashboardPage() {
  const router = useRouter();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { loading, stats, recentPurchases, recentSales, topMembers, recentExpenses, reload } = useDashboardData();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Refresh dashboard data when page becomes visible (e.g., user navigates back from expenses page)
  const lastRefreshTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const MIN_REFRESH_INTERVAL = 2000; // Minimum 2 seconds between refreshes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only refresh if enough time has passed since last refresh
        if (now - lastRefreshTimeRef.current > MIN_REFRESH_INTERVAL) {
          lastRefreshTimeRef.current = now;
          reload();
        }
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      // Only refresh if enough time has passed since last refresh
      if (now - lastRefreshTimeRef.current > MIN_REFRESH_INTERVAL) {
        lastRefreshTimeRef.current = now;
        reload();
      }
    };

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Listen for window focus (user switches back to the tab/window)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [reload]);

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Header Section */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg lg:flex">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="hidden text-2xl font-bold tracking-tight lg:block">
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
                  แดชบอร์ด
                </span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">ภาพรวมกิจการรับซื้อยาง</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            ถามข้อมูล
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />
        </div>
      ) : (
        <>
          <div className="flex-shrink-0">
            <DashboardStatsCards stats={stats} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RecentPurchasesList purchases={recentPurchases} />
            <RecentSalesList sales={recentSales} />
            <RecentExpensesList expenses={recentExpenses} />
            <TopMembersList topMembers={topMembers} />
          </div>
        </>
      )}
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}

