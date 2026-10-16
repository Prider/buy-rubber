import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getApiClient } from '@/lib/apiClient';
import type { PeriodBounds } from '@/lib/dashboard/activity';
import type { TrendPoint } from '@/lib/dashboard/trend';
import { logger } from '@/lib/logger';

export interface ProductBreakdownRow {
  productTypeId: string | null;
  productTypeName: string;
  productTypeCode: string;
  count: number;
  totalAmount: number;
  totalWeight: number;
}

export interface DashboardStats {
  todayPurchases: number;
  todayAmount: number;
  monthPurchases: number;
  monthAmount: number;
  totalMembers: number;
  activeMembers: number;
  todayExpenses: number;
  todayExpenseAmount: number;
  monthExpenses: number;
  monthExpenseAmount: number;
  todayServiceFees: number;
  todayServiceFeeAmount: number;
  monthServiceFees: number;
  monthServiceFeeAmount: number;
  todaySales: number;
  todaySaleAmount: number;
  monthSales: number;
  monthSaleAmount: number;
  todayPurchasesByProductType?: ProductBreakdownRow[];
  monthPurchasesByProductType?: ProductBreakdownRow[];
  todaySalesByProductType?: ProductBreakdownRow[];
  monthSalesByProductType?: ProductBreakdownRow[];
}

export interface DashboardData {
  stats: DashboardStats;
  bounds?: PeriodBounds;
  trend?: TrendPoint[];
  todayPrices: any[];
  productTypes: any[];
  recentPurchases: any[];
  topMembers: any[];
  recentExpenses: any[];
  recentSales: any[];
  recentServiceFees?: any[];
}

interface UseDashboardDataReturn {
  loading: boolean;
  error: string | null;
  data: DashboardData | null;
  stats: DashboardStats;
  bounds: PeriodBounds | null;
  trend: TrendPoint[];
  todayPrices: any[];
  productTypes: any[];
  recentPurchases: any[];
  topMembers: any[];
  recentExpenses: any[];
  recentSales: any[];
  recentServiceFees: any[];
  reload: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;

    if (!hasDataRef.current) setLoading(true);

    try {
      const apiClient = getApiClient();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard request timeout after 30 seconds')), 30000);
      });

      const response = await Promise.race([
        apiClient.getDashboard(),
        timeoutPromise,
      ]) as DashboardData;

      if (mountedRef.current) {
        hasDataRef.current = true;
        setData(response);
        setError(null);
        setLoading(false);
      }
    } catch (loadError) {
      logger.error('Failed to load dashboard', loadError);
      if (mountedRef.current) {
        setLoading(false);
        setError('ไม่สามารถโหลดแดชบอร์ดได้');
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const defaultStats: DashboardStats = useMemo(() => ({
    todayPurchases: 0,
    todayAmount: 0,
    monthPurchases: 0,
    monthAmount: 0,
    totalMembers: 0,
    activeMembers: 0,
    todayExpenses: 0,
    todayExpenseAmount: 0,
    monthExpenses: 0,
    monthExpenseAmount: 0,
    todayServiceFees: 0,
    todayServiceFeeAmount: 0,
    monthServiceFees: 0,
    monthServiceFeeAmount: 0,
    todaySales: 0,
    todaySaleAmount: 0,
    monthSales: 0,
    monthSaleAmount: 0,
  }), []);

  const stats = useMemo(() => data?.stats || defaultStats, [data?.stats, defaultStats]);
  const todayPrices = useMemo(() => data?.todayPrices || [], [data?.todayPrices]);
  const productTypes = useMemo(() => data?.productTypes || [], [data?.productTypes]);
  const recentPurchases = useMemo(() => data?.recentPurchases || [], [data?.recentPurchases]);
  const topMembers = useMemo(() => data?.topMembers || [], [data?.topMembers]);
  const recentExpenses = useMemo(() => data?.recentExpenses || [], [data?.recentExpenses]);
  const recentSales = useMemo(() => data?.recentSales || [], [data?.recentSales]);
  const recentServiceFees = useMemo(() => data?.recentServiceFees || [], [data?.recentServiceFees]);
  const trend = useMemo(() => data?.trend || [], [data?.trend]);
  const bounds = data?.bounds ?? null;

  return {
    loading,
    error,
    data,
    stats,
    bounds,
    trend,
    todayPrices,
    productTypes,
    recentPurchases,
    topMembers,
    recentExpenses,
    recentSales,
    recentServiceFees,
    reload: loadData,
  };
}
