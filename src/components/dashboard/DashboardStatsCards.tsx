import { formatCurrency } from '@/lib/utils';
import { DashboardStats } from '@/hooks/useDashboardData';

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export default function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Today Purchases Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-primary-200/50 dark:border-primary-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white dark:bg-primary-500">
              วันนี้
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
              รับซื้อวันนี้
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {stats.todayPurchases || 0}
            </p>
            <p className="text-base font-semibold text-primary-600 dark:text-primary-400">
              {formatCurrency(stats.todayAmount || 0)}
            </p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary-200/30 dark:bg-primary-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>

      {/* Month Purchases Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-green-200/50 dark:border-green-800/30">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white dark:bg-green-500">
              เดือนนี้
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
              รับซื้อเดือนนี้
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {stats.monthPurchases || 0}
            </p>
            <p className="text-base font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(stats.monthAmount || 0)}
            </p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-green-200/30 dark:bg-green-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>

      {/* Members Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-blue-200/50 dark:border-blue-800/30 sm:col-span-2 lg:col-span-1">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/80 dark:bg-gray-900/40 rounded-xl backdrop-blur-sm shadow-sm">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
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
              {stats.activeMembers || 0}
            </p>
            <p className="text-base font-medium text-gray-600 dark:text-gray-400">
              จากทั้งหมด <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.totalMembers || 0}</span> ราย
            </p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
      </div>
    </div>
  );
}

