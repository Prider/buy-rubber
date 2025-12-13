'use client';

import { memo, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';
import { TodayPurchasesCardByProductType } from './TodayPurchasesCardByProductType';

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

// Memoized individual card component to prevent unnecessary re-renders
interface StatCardProps {
  title: string;
  value: number;
  amount: number;
  label: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

const StatCard = memo<StatCardProps>(({
  title,
  value,
  amount,
  label,
  icon,
  gradientFrom,
  gradientTo,
  borderColor,
  textColor,
  badgeBg,
}) => {
  // Memoize formatted amount to avoid recalculation
  const formattedAmount = useMemo(
    () => formatCurrency(amount || 0),
    [amount]
  );

  // Memoize gradient color extraction to avoid repeated split() calls
  const gradientColor = useMemo(() => {
    const parts = gradientFrom.split(' ');
    return parts[1] || 'primary-200';
  }, [gradientFrom]);

  // Memoize all class names to prevent recalculation
  const containerClassName = useMemo(
    () => `relative overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 border ${borderColor}`,
    [gradientFrom, gradientTo, borderColor]
  );

  const decorativeClassName = useMemo(
    () => `absolute -right-4 -bottom-4 w-32 h-32 ${gradientColor}/20 dark:${gradientColor}/10 rounded-full opacity-20`,
    [gradientColor]
  );

  return (
    <div className={containerClassName}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl shadow-sm">
            {icon}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeBg} text-white`}>
            {label}
          </span>
        </div>
        <div className="space-y-2">
          <p className={`text-sm font-semibold ${textColor} uppercase tracking-wider`}>
            {title}
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {value || 0}
          </p>
          <p className={`text-base font-semibold ${textColor}`}>
            {formattedAmount}
          </p>
        </div>
      </div>
      {/* Simplified decorative element - no blur or scale animations for performance */}
      <div className={decorativeClassName}></div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Memoized Members Card component
interface MembersCardProps {
  activeMembers: number;
  totalMembers: number;
  icon: React.ReactNode;
}

const MembersCard = memo<MembersCardProps>(({ activeMembers, totalMembers, icon }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/10 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 border border-blue-200/50 dark:border-blue-800/30 lg:col-span-1">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl shadow-sm">
            {icon}
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white dark:bg-blue-500">
            สมาชิก
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            จำนวนสมาชิก
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {activeMembers}
          </p>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400">
            จากทั้งหมด <span className="font-semibold text-blue-600 dark:text-blue-400">{totalMembers}</span> ราย
          </p>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-200/20 dark:bg-blue-700/10 rounded-full opacity-20"></div>
    </div>
  );
});

MembersCard.displayName = 'MembersCard';

function DashboardStatsCardsComponent({ stats }: DashboardStatsCardsProps) {
  // Memoize icons to prevent recreation
  const todayPurchaseIcon = useMemo(() => (
    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ), []);

  const monthPurchaseIcon = useMemo(() => (
    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ), []);

  const todayExpenseIcon = useMemo(() => (
    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ), []);

  const monthExpenseIcon = useMemo(() => (
    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), []);

  const membersIcon = useMemo(() => (
    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ), []);

  // Safety check: ensure stats is defined (after all hooks)
  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      
      {/* Today Purchases Card */}
      <StatCard
        title="รับซื้อ"
        value={stats.todayPurchases || 0}
        amount={stats.todayAmount || 0}
        label="วันนี้"
        icon={todayPurchaseIcon}
        gradientFrom="from-primary-50"
        gradientTo="to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10"
        borderColor="border-primary-200/50 dark:border-primary-800/30"
        textColor="text-primary-700 dark:text-primary-300"
        badgeBg="bg-primary-600 dark:bg-primary-500"
      />

      {/* Month Purchases Card */}
      <StatCard
        title="รับซื้อเดือนนี้"
        value={stats.monthPurchases || 0}
        amount={stats.monthAmount || 0}
        label="เดือนนี้"
        icon={monthPurchaseIcon}
        gradientFrom="from-green-50"
        gradientTo="to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10"
        borderColor="border-green-200/50 dark:border-green-800/30"
        textColor="text-green-700 dark:text-green-300"
        badgeBg="bg-green-600 dark:bg-green-500"
      />

      {/* Today Expenses Card */}
      <StatCard
        title="ค่าใช้จ่ายวันนี้"
        value={stats.todayExpenses || 0}
        amount={stats.todayExpenseAmount || 0}
        label="วันนี้"
        icon={todayExpenseIcon}
        gradientFrom="from-red-50"
        gradientTo="to-orange-100 dark:from-red-900/20 dark:to-orange-800/10"
        borderColor="border-red-200/50 dark:border-red-800/30"
        textColor="text-red-700 dark:text-red-300"
        badgeBg="bg-red-600 dark:bg-red-500"
      />

      {/* Month Expenses Card */}
      <StatCard
        title="ค่าใช้จ่ายเดือนนี้"
        value={stats.monthExpenses || 0}
        amount={stats.monthExpenseAmount || 0}
        label="เดือนนี้"
        icon={monthExpenseIcon}
        gradientFrom="from-purple-50"
        gradientTo="to-pink-100 dark:from-purple-900/20 dark:to-pink-800/10"
        borderColor="border-purple-200/50 dark:border-purple-800/30"
        textColor="text-purple-700 dark:text-purple-300"
        badgeBg="bg-purple-600 dark:bg-purple-500"
      />

        {/* Members Card - Special handling for the additional text */}
        <MembersCard
          activeMembers={stats.activeMembers || 0}
          totalMembers={stats.totalMembers || 0}
          icon={membersIcon}
        />

        <TodayPurchasesCardByProductType stats={stats} />
      </div>
    </div>
  );
}

export default memo(DashboardStatsCardsComponent);

