'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiClient } from '@/shared/apiClient';
import { logger } from '@/shared/logger';
import { PurchaseSummary } from '@/industries/rubber/types/memberHistory';

interface UseMemberPurchaseHistoryParams {
  memberId?: string;
  currentPage: number;
  startDate: string;
  endDate: string;
}

export const useMemberPurchaseHistory = ({
  memberId,
  currentPage,
  startDate,
  endDate,
}: UseMemberPurchaseHistoryParams) => {
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary>({
    totalPurchases: 0,
    totalAmount: 0,
    totalWeight: 0,
    avgPrice: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  const loadPurchaseHistory = useCallback(async () => {
    if (!memberId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '8',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const data = await getApiClient().get<{
        purchases?: unknown[];
        summary?: PurchaseSummary;
        pagination?: { totalPages?: number };
      }>(`/api/members/${memberId}/purchases?${params}`);
      setPurchases(data.purchases || []);
      setSummary(
        data.summary || {
          totalPurchases: 0,
          totalAmount: 0,
          totalWeight: 0,
          avgPrice: 0,
        }
      );
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      logger.error('Failed to load purchase history', error);
    } finally {
      setLoading(false);
    }
  }, [memberId, currentPage, startDate, endDate]);

  useEffect(() => {
    loadPurchaseHistory();
  }, [loadPurchaseHistory]);

  return {
    loading,
    purchases,
    summary,
    totalPages,
    reload: loadPurchaseHistory,
  };
};

export type { PurchaseSummary } from '@/industries/rubber/types/memberHistory';

