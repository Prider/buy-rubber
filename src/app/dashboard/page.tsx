'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import axios from 'axios';
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
      const response = await axios.get('/api/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">แดชบอร์ด</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">ภาพรวมกิจการรับซื้อยาง</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today Purchases */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รับซื้อวันนี้
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.todayPurchases || 0}
                </p>
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                  {formatCurrency(stats.todayAmount || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
          </div>

          {/* Month Purchases */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รับซื้อเดือนนี้
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.monthPurchases || 0}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(stats.monthAmount || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  จำนวนสมาชิก
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {stats.activeMembers || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  จากทั้งหมด {stats.totalMembers || 0} ราย
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Unpaid */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ยอดค้างจ่าย
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {formatCurrency(stats.unpaidAmount || 0)}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  เบิกล่วงหน้า: {formatCurrency(stats.totalAdvance || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Purchases */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              รายการรับซื้อล่าสุด
            </h2>
            <div className="space-y-3">
              {data?.recentPurchases?.length > 0 ? (
                data.recentPurchases.slice(0, 5).map((purchase: any) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {purchase.member?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {purchase.productType?.name} •{' '}
                        {formatNumber(purchase.dryWeight)} กก.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary-600 dark:text-primary-400">
                        {formatCurrency(purchase.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(purchase.date).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  ยังไม่มีรายการรับซื้อ
                </p>
              )}
            </div>
          </div>

          {/* Top Members */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              สมาชิกที่รับซื้อมากที่สุด (เดือนนี้)
            </h2>
            <div className="space-y-3">
              {data?.topMembers?.length > 0 ? (
                data.topMembers.map((item: any, index: number) => (
                  <div
                    key={item.member?.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.member?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(item.totalWeight)} กก.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(item.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  ยังไม่มีข้อมูล
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

