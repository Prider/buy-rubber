'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import RecentPurchasesList from '@/components/dashboard/RecentPurchasesList';
import RecentSalesList from '@/components/dashboard/RecentSalesList';
import TopMembersList from '@/components/dashboard/TopMembersList';
import RecentExpensesList from '@/components/dashboard/RecentExpensesList';
import GamerLoader from '@/components/GamerLoader';

export default function DashboardPage() {
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-2 md:gap-5 lg:gap-6 lg:pb-4">
      <div className="min-w-0">
        <DashboardStatsCards stats={stats} />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
        <RecentPurchasesList purchases={recentPurchases} />
        <RecentSalesList sales={recentSales} />
        <RecentExpensesList expenses={recentExpenses} />
        <TopMembersList topMembers={topMembers} />
      </div>
    </div>
  );
}

