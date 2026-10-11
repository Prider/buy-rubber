'use client';

import { memo, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';
import { TodayPurchasesCardByProductType } from './TodayPurchasesCardByProductType';
import { TodayWeightsCardByProductType } from './TodayWeightsCardByProductType';

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
    () => `relative min-w-0 overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl border p-2.5 shadow-sm transition-shadow duration-200 hover:shadow-lg md:p-3 lg:p-3.5 ${borderColor}`,
    [gradientFrom, gradientTo, borderColor]
  );

  const decorativeClassName = useMemo(
    () => `absolute -right-4 -bottom-4 w-32 h-32 ${gradientColor}/20 dark:${gradientColor}/10 rounded-full opacity-20`,
    [gradientColor]
  );

  return (
    <div className={containerClassName}>
      <div className="relative z-10">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="rounded-lg bg-white/80 p-1.5 shadow-sm dark:bg-gray-900/40">
            {icon}
          </div>
          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white ${badgeBg}`}>
            {label}
          </span>
        </div>
        <div className="space-y-0.5">
          <p className={`text-sm font-bold leading-snug tracking-tight ${textColor} lg:text-base`}>
            {title}
          </p>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-gray-950 dark:text-white md:text-3xl lg:text-4xl">
            {value || 0}
          </p>
          <p className={`break-words text-base font-bold tabular-nums tracking-tight ${textColor} lg:text-lg`}>
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
    <div className="relative h-full overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-blue-800/30 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 md:p-5 lg:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20 opacity-0 transition-opacity duration-300 hover:opacity-100 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-blue-700 dark:text-blue-300">
              สมาชิกที่ active
            </p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              จากทั้งหมด <span className="font-semibold text-blue-700 dark:text-blue-300">{totalMembers}</span> ราย
            </p>
          </div>
          <p className="shrink-0 text-3xl font-bold tabular-nums text-blue-700 dark:text-blue-300 md:text-4xl">
            {activeMembers}
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
              {icon}
            </div>
            <span className="inline-flex max-w-[11rem] items-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 py-1 text-center text-xs font-medium leading-snug text-white shadow-md dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500">
              สมาชิกที่มีการซื้อยาง
            </span>
          </div>
          <div className="space-y-2 text-center">
            <p className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-lg font-semibold text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              สมาชิกที่ active
            </p>
            <p className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-5xl font-bold tabular-nums text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              {activeMembers}
            </p>
            <p className="text-xl font-medium text-gray-600 dark:text-gray-400">
              จากทั้งหมด <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-semibold text-transparent dark:from-blue-400 dark:to-indigo-400">{totalMembers}</span> ราย
            </p>
          </div>
        </div>
      </div>
      {/* Animated decorative gradient circles */}
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gradient-to-br from-blue-400/30 via-indigo-400/30 to-purple-400/30 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
});

MembersCard.displayName = 'MembersCard';

function DashboardStatsCardsComponent({ stats }: DashboardStatsCardsProps) {
  // Memoize icons to prevent recreation
  const todayPurchaseIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ), []);

  const monthPurchaseIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ), []);

  const todaySaleIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ), []);

  const monthSaleIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h8m-8 4h5m-9 9h14a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
    </svg>
  ), []);

  const todayExpenseIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ), []);

  const monthExpenseIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), []);

  const todayServiceFeeIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ), []);

  const monthServiceFeeIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v13m0-13V6a2 2 0 112 2v7m0 0v5a2 2 0 11-4 0v-5m4 0h-2.5M4 15h2.5m13 0h-2.5" />
    </svg>
  ), []);

  const membersIcon = useMemo(() => (
    <svg className="h-8 w-8 lg:h-9 lg:w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ), []);

  // Safety check: ensure stats is defined (after all hooks)
  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-5">
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-4 lg:gap-4">
        
        {/* Today Purchases Card */}
        <StatCard
          title="รับซื้อ"
          value={stats.todayPurchases || 0}
          amount={stats.todayAmount || 0}
          label="วันนี้"
          icon={todayPurchaseIcon}
          gradientFrom="from-primary-50 dark:from-primary-900/50"
          gradientTo="to-primary-100 dark:to-primary-800/40"
          borderColor="border-primary-200/50 dark:border-primary-800/50"
          textColor="text-primary-900 dark:text-primary-100"
          badgeBg="bg-primary-600 dark:bg-primary-500"
        />

        {/* Month Purchases Card */}
        <StatCard
          title="รับซื้อเดือนนี้"
          value={stats.monthPurchases || 0}
          amount={stats.monthAmount || 0}
          label="เดือนนี้"
          icon={monthPurchaseIcon}
          gradientFrom="from-blue-50 dark:from-blue-900/50"
          gradientTo="to-indigo-100 dark:to-indigo-800/40"
          borderColor="border-blue-200/50 dark:border-blue-800/50"
          textColor="text-blue-900 dark:text-blue-100"
          badgeBg="bg-blue-600 dark:bg-blue-500"
        />

        {/* Today Sales Card */}
        <StatCard
          title="ขาย"
          value={stats.todaySales || 0}
          amount={stats.todaySaleAmount || 0}
          label="วันนี้"
          icon={todaySaleIcon}
          gradientFrom="from-emerald-50 dark:from-emerald-900/50"
          gradientTo="to-emerald-100 dark:to-emerald-800/40"
          borderColor="border-emerald-200/50 dark:border-emerald-800/50"
          textColor="text-emerald-900 dark:text-emerald-100"
          badgeBg="bg-emerald-600 dark:bg-emerald-500"
        />

        {/* Month Sales Card */}
        <StatCard
          title="ขายเดือนนี้"
          value={stats.monthSales || 0}
          amount={stats.monthSaleAmount || 0}
          label="เดือนนี้"
          icon={monthSaleIcon}
          gradientFrom="from-teal-50 dark:from-teal-900/50"
          gradientTo="to-teal-100 dark:to-teal-800/40"
          borderColor="border-teal-200/50 dark:border-teal-800/50"
          textColor="text-teal-900 dark:text-teal-100"
          badgeBg="bg-teal-600 dark:bg-teal-500"
        />

        {/* Today Service Fees Card */}
        <StatCard
          title="ค่าบริการวันนี้"
          value={stats.todayServiceFees || 0}
          amount={stats.todayServiceFeeAmount || 0}
          label="วันนี้"
          icon={todayServiceFeeIcon}
          gradientFrom="from-yellow-50 dark:from-yellow-900/50"
          gradientTo="to-amber-100 dark:to-amber-800/40"
          borderColor="border-yellow-200/50 dark:border-yellow-800/50"
          textColor="text-yellow-950 dark:text-yellow-100"
          badgeBg="bg-yellow-600 dark:bg-yellow-500"
        />

        {/* Month Service Fees Card */}
        <StatCard
          title="ค่าบริการเดือนนี้"
          value={stats.monthServiceFees || 0}
          amount={stats.monthServiceFeeAmount || 0}
          label="เดือนนี้"
          icon={monthServiceFeeIcon}
          gradientFrom="from-amber-50 dark:from-amber-900/50"
          gradientTo="to-orange-100 dark:to-orange-800/40"
          borderColor="border-amber-200/50 dark:border-amber-800/50"
          textColor="text-amber-950 dark:text-amber-100"
          badgeBg="bg-amber-600 dark:bg-amber-500"
        />

        {/* Today Expenses Card */}
        <StatCard
          title="ค่าใช้จ่ายวันนี้"
          value={stats.todayExpenses || 0}
          amount={stats.todayExpenseAmount || 0}
          label="วันนี้"
          icon={todayExpenseIcon}
          gradientFrom="from-red-50 dark:from-red-900/50"
          gradientTo="to-orange-100 dark:to-orange-800/40"
          borderColor="border-red-200/50 dark:border-red-800/50"
          textColor="text-red-900 dark:text-red-100"
          badgeBg="bg-red-600 dark:bg-red-500"
        />

        {/* Month Expenses Card */}
        <StatCard
          title="ค่าใช้จ่ายเดือนนี้"
          value={stats.monthExpenses || 0}
          amount={stats.monthExpenseAmount || 0}
          label="เดือนนี้"
          icon={monthExpenseIcon}
          gradientFrom="from-red-50 dark:from-red-900/50"
          gradientTo="to-rose-100 dark:to-rose-800/40"
          borderColor="border-red-200/50 dark:border-red-800/50"
          textColor="text-red-900 dark:text-red-100"
          badgeBg="bg-red-600 dark:bg-red-500"
        />
      </div>

      {/* Members Card and Today Purchases by Product Type - Two Column Layout */}
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-2">
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            <TodayPurchasesCardByProductType stats={stats} />
            <TodayWeightsCardByProductType stats={stats} />
          </div>
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <MembersCard
            activeMembers={stats.activeMembers || 0}
            totalMembers={stats.totalMembers || 0}
            icon={membersIcon}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardStatsCardsComponent);

