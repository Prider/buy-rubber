import { useState, useEffect } from 'react';
import { getApiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';

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
}

export interface DashboardData {
  stats: DashboardStats;
  todayPrices: any[];
  productTypes: any[];
  recentPurchases: any[];
  topMembers: any[];
  recentExpenses: any[];
}

interface UseDashboardDataReturn {
  loading: boolean;
  data: DashboardData | null;
  stats: DashboardStats;
  todayPrices: any[];
  productTypes: any[];
  recentPurchases: any[];
  topMembers: any[];
  recentExpenses: any[];
  reload: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.getDashboard();
      setData(response as DashboardData);
    } catch (error) {
      logger.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const defaultStats: DashboardStats = {
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
  };

  return {
    loading,
    data,
    stats: data?.stats || defaultStats,
    todayPrices: data?.todayPrices || [],
    productTypes: data?.productTypes || [],
    recentPurchases: data?.recentPurchases || [],
    topMembers: data?.topMembers || [],
    recentExpenses: data?.recentExpenses || [],
    reload: loadData,
  };
}

