'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { PurchaseSummary } from '@/types/memberHistory';

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

      const response = await axios.get(`/api/members/${memberId}/purchases?${params}`);
      setPurchases(response.data.purchases || []);
      setSummary(
        response.data.summary || {
          totalPurchases: 0,
          totalAmount: 0,
          totalWeight: 0,
          avgPrice: 0,
        }
      );
      setTotalPages(response.data.pagination?.totalPages || 1);
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

export type { PurchaseSummary } from '@/types/memberHistory';

