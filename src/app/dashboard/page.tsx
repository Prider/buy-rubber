'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { getApiClient } from '@/lib/apiClient';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // ตรวจสอบ token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.getDashboard();
      setData(response);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"></div>
            <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">แดชบอร์ด</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">ภาพรวมกิจการรับซื้อยาง</p>
        </div>

        {/* Stats Grid - Modern Cards */}
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

        {/* Recent Activities - Modern Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Purchases */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </span>
                  รายการรับซื้อล่าสุด
                </h2>
                {data?.recentPurchases?.length > 0 && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {data.recentPurchases.length} รายการ
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.recentPurchases?.length > 0 ? (
                  data.recentPurchases.slice(0, 5).map((purchase: any, idx: number) => (
                    <div
                      key={purchase.id}
                      className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 rounded-full flex items-center justify-center font-semibold text-primary-700 dark:text-primary-300 text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {purchase.member?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {purchase.productType?.name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatNumber(purchase.dryWeight)} กก.
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">
                          {formatCurrency(purchase.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(purchase.date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">ยังไม่มีรายการรับซื้อ</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Members */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </span>
                  สมาชิกที่รับซื้อมากที่สุด
                </h2>
                {data?.topMembers?.length > 0 && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    เดือนนี้
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.topMembers?.length > 0 ? (
                  data.topMembers.map((item: any, index: number) => (
                    <div
                      key={item.member?.id}
                      className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.member?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            น้ำหนัก: <span className="font-semibold">{formatNumber(item.totalWeight)}</span> กก.
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">
                          {formatCurrency(item.totalAmount)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">ยังไม่มีข้อมูล</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

