'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { MemberHistoryRow, MemberHistorySummary } from '@/types/memberHistory';

interface UseMemberHistoryParams {
  memberId?: string;
  currentPage: number;
  startDate: string;
  endDate: string;
}

const EMPTY_SUMMARY: MemberHistorySummary = {
  purchaseCount: 0,
  purchaseAmount: 0,
  totalWeight: 0,
  avgPrice: 0,
  totalRecords: 0,
};

export const useMemberHistory = ({
  memberId,
  currentPage,
  startDate,
  endDate,
}: UseMemberHistoryParams) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MemberHistoryRow[]>([]);
  const [summary, setSummary] = useState<MemberHistorySummary>(EMPTY_SUMMARY);
  const [totalPages, setTotalPages] = useState(1);

  const loadHistory = useCallback(async () => {
    if (!memberId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(`/api/members/${memberId}/history?${params}`);
      setRows(response.data.rows || []);
      setSummary(response.data.summary || EMPTY_SUMMARY);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      logger.error('Failed to load member history', error);
      setRows([]);
      setSummary(EMPTY_SUMMARY);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [memberId, currentPage, startDate, endDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    loading,
    rows,
    summary,
    totalPages,
    reload: loadHistory,
  };
};
