'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData, type ProductBreakdownRow } from '@/hooks/useDashboardData';
import { isWithinPeriod, productTypeMatches, type DashboardPeriod } from '@/lib/dashboard/activity';
import ActivityList, { formatActivityWhen, formatWeightDetail, type ActivityRow } from '@/components/dashboard/ActivityList';
import PriceStrip from '@/components/dashboard/PriceStrip';
import ProductBreakdown from '@/components/dashboard/ProductBreakdown';
import SummaryMetricCards, { type DashboardMetric } from '@/components/dashboard/SummaryMetricCards';
import WeekTrendChart from '@/components/dashboard/WeekTrendChart';
import GamerLoader from '@/components/GamerLoader';

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today: 'วันนี้',
  month: 'เดือนนี้',
};

const LIST_TITLE: Record<DashboardMetric, string> = {
  purchases: 'รายการรับซื้อ',
  sales: 'รายการขาย',
  serviceFees: 'รายการค่าบริการ',
  expenses: 'รายการค่าใช้จ่าย',
};

const EMPTY_LABEL: Record<DashboardMetric, string> = {
  purchases: 'ยังไม่มีรายการรับซื้อ',
  sales: 'ยังไม่มีรายการขาย',
  serviceFees: 'ยังไม่มีค่าบริการ',
  expenses: 'ยังไม่มีค่าใช้จ่าย',
};

function rowsForPeriod<T extends { date: string | Date }>(
  rows: T[],
  period: DashboardPeriod,
  bounds: ReturnType<typeof useDashboardData>['bounds'],
): T[] {
  if (!bounds) return rows;
  return rows.filter((row) => isWithinPeriod(row.date, period, bounds));
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    loading,
    error,
    stats,
    bounds,
    trend,
    todayPrices,
    productTypes,
    recentPurchases,
    recentSales,
    recentExpenses,
    recentServiceFees,
    reload,
  } = useDashboardData();
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [metric, setMetric] = useState<DashboardMetric>('purchases');
  const [productTypeId, setProductTypeId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const lastRefreshTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const MIN_REFRESH_INTERVAL = 2000;

    const refreshIfDue = () => {
      const now = Date.now();
      if (now - lastRefreshTimeRef.current > MIN_REFRESH_INTERVAL) {
        lastRefreshTimeRef.current = now;
        reload();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshIfDue();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshIfDue);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshIfDue);
    };
  }, [reload]);

  const breakdown = useMemo(() => {
    const purchaseRows = period === 'today'
      ? stats.todayPurchasesByProductType
      : stats.monthPurchasesByProductType;
    const saleRows = period === 'today'
      ? stats.todaySalesByProductType
      : stats.monthSalesByProductType;
    const source = metric === 'sales' ? saleRows : purchaseRows;
    return source || [];
  }, [metric, period, stats]);

  const selectedTypeName = breakdown.find((row) => row.productTypeId === productTypeId)?.productTypeName
    || productTypes.find((type: { id: string; name: string }) => type.id === productTypeId)?.name;

  const activity = useMemo(() => {
    const canFilterByType = metric === 'purchases' || metric === 'sales';
    const activeTypeId = canFilterByType ? productTypeId : null;

    if (metric === 'purchases') {
      return rowsForPeriod(recentPurchases, period, bounds)
        .filter((purchase) => productTypeMatches(purchase, activeTypeId))
        .map((purchase): ActivityRow => ({
          id: purchase.id,
          title: purchase.member?.name || purchase.purchaseNo || '-',
          detail: formatWeightDetail(purchase.productType?.name, purchase.dryWeight),
          amount: purchase.totalAmount || 0,
          when: formatActivityWhen(purchase.date),
        }));
    }

    if (metric === 'sales') {
      return rowsForPeriod(recentSales, period, bounds)
        .filter((sale) => productTypeMatches(sale, activeTypeId))
        .map((sale): ActivityRow => ({
          id: sale.id,
          title: sale.companyName || sale.saleNo || '-',
          detail: formatWeightDetail(sale.productType?.name, sale.weight),
          amount: sale.totalAmount || 0,
          when: formatActivityWhen(sale.date),
        }));
    }

    if (metric === 'serviceFees') {
      return rowsForPeriod(recentServiceFees, period, bounds).map((fee): ActivityRow => ({
        id: fee.id,
        title: fee.category || fee.serviceFeeNo || 'ค่าบริการ',
        detail: fee.notes || fee.serviceFeeNo || '-',
        amount: fee.amount || 0,
        when: formatActivityWhen(fee.date),
      }));
    }

    return rowsForPeriod(recentExpenses, period, bounds).map((expense): ActivityRow => ({
      id: expense.id,
      title: expense.category || 'ค่าใช้จ่าย',
      detail: expense.description || expense.expenseNo || '-',
      amount: expense.amount || 0,
      when: formatActivityWhen(expense.date),
    }));
  }, [bounds, metric, period, productTypeId, recentExpenses, recentPurchases, recentSales, recentServiceFees]);

  const listTitle = selectedTypeName && (metric === 'purchases' || metric === 'sales')
    ? `${LIST_TITLE[metric]}${PERIOD_LABEL[period]} · ${selectedTypeName}`
    : `${LIST_TITLE[metric]}${PERIOD_LABEL[period]}`;

  const todayLabel = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const selectProduct = (id: string) => {
    const openPurchases = metric === 'serviceFees' || metric === 'expenses';
    if (openPurchases) setMetric('purchases');
    setProductTypeId((current) => (openPurchases || current !== id ? id : null));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold">
            <span className="animate-gradient bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
              แดชบอร์ด
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{todayLabel}</p>
        </div>
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800" role="group" aria-label="ช่วงเวลา">
          {(['today', 'month'] as const).map((value) => {
            const selected = period === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setPeriod(value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                  selected
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm dark:from-blue-600 dark:to-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {PERIOD_LABEL[value]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 md:gap-5 sm:px-5">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100" role="alert">
          {error}
        </p>
      ) : null}

      <PriceStrip productTypes={productTypes} todayPrices={todayPrices} />
      <SummaryMetricCards stats={stats} period={period} metric={metric} onSelect={setMetric} />
      <ProductBreakdown
        rows={breakdown as ProductBreakdownRow[]}
        selectedId={metric === 'serviceFees' || metric === 'expenses' ? null : productTypeId}
        onSelect={selectProduct}
      />
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">
          <ActivityList
            title={listTitle}
            metric={metric}
            rows={activity}
            emptyLabel={productTypeId && (metric === 'purchases' || metric === 'sales')
              ? 'ยังไม่มีรายการของประเภทนี้'
              : EMPTY_LABEL[metric]}
          />
        </div>
        <div className="min-w-0 lg:col-span-3">
          <WeekTrendChart points={trend} />
        </div>
      </div>
      </div>
    </div>
  );
}
