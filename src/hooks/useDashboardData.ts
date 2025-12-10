import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      const apiClient = getApiClient();
      
      // Add a timeout wrapper to ensure we don't hang forever
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard request timeout after 30 seconds')), 30000);
      });
      
      const response = await Promise.race([
        apiClient.getDashboard(),
        timeoutPromise,
      ]) as DashboardData;
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setData(response);
        setLoading(false);
      }
    } catch (error) {
      logger.error('Failed to load dashboard', error);
      // Always set loading to false on error if still mounted
      if (mountedRef.current) {
        setLoading(false);
        // Set empty data to prevent infinite loading
        setData(null);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  // Memoize default stats to prevent object recreation on every render
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
  }), []);

  // Memoize stats to prevent unnecessary re-renders
  const stats = useMemo(() => {
    return data?.stats || defaultStats;
  }, [data?.stats, defaultStats]);

  // Memoize arrays to prevent unnecessary re-renders
  const todayPrices = useMemo(() => data?.todayPrices || [], [data?.todayPrices]);
  const productTypes = useMemo(() => data?.productTypes || [], [data?.productTypes]);
  const recentPurchases = useMemo(() => data?.recentPurchases || [], [data?.recentPurchases]);
  const topMembers = useMemo(() => data?.topMembers || [], [data?.topMembers]);
  const recentExpenses = useMemo(() => data?.recentExpenses || [], [data?.recentExpenses]);

  return {
    loading,
    data,
    stats,
    todayPrices,
    productTypes,
    recentPurchases,
    topMembers,
    recentExpenses,
    reload: loadData,
  };
}

