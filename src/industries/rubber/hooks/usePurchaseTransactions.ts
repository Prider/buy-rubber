import { useState, useCallback, useEffect, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { getApiClient } from '@/shared/apiClient';
import { PurchaseTransaction, PaginationInfo } from '@/industries/rubber/ui/purchases/types';

type TransactionsResponse =
  | PurchaseTransaction[]
  | { transactions?: PurchaseTransaction[]; pagination?: PaginationInfo };

function readErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const apiError = err.response?.data?.error;
    if (typeof apiError === 'string' && apiError.length > 0) {
      return apiError;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
}

const ITEMS_PER_PAGE = 20;

function uniqueByPurchaseNo(items: PurchaseTransaction[]): PurchaseTransaction[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.purchaseNo || seen.has(item.purchaseNo)) {
      return false;
    }
    seen.add(item.purchaseNo);
    return true;
  });
}

interface UsePurchaseTransactionsReturn {
  transactions: PurchaseTransaction[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  loadTransactions: (page: number, searchTerm?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const usePurchaseTransactions = (initialPage: number = 1): UsePurchaseTransactionsReturn => {
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Use ref to store cancel token for cleanup
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, []);

  const loadTransactions = useCallback(async (page: number = 1, searchTerm?: string) => {
    // Cancel previous request if it exists
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New request initiated');
    }
    
    const cancelToken = axios.CancelToken.source();
    cancelTokenRef.current = cancelToken;
    
    try {
      setLoading(true);
      setError('');
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const data = await getApiClient().get<TransactionsResponse>(
        `/api/purchases/transactions?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`,
        { cancelToken: cancelToken.token },
      );

      // Handle both old format (array) and new format (object with transactions and pagination)
      if (Array.isArray(data)) {
        setTransactions(uniqueByPurchaseNo(data));
        const total = data.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        setPagination({
          page,
          limit: ITEMS_PER_PAGE,
          total,
          totalPages,
          hasMore: page < totalPages,
        });
      } else {
        setTransactions(uniqueByPurchaseNo(data.transactions || []));
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        return; // Request was cancelled, don't update state
      }
      setError(readErrorMessage(err));
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
      if (cancelTokenRef.current === cancelToken) {
        cancelTokenRef.current = null;
      }
    }
  }, []);

  const refresh = useCallback(async (searchTerm?: string) => {
    await loadTransactions(currentPage, searchTerm);
  }, [currentPage, loadTransactions]);

  return {
    transactions,
    pagination,
    loading,
    error,
    currentPage,
    setCurrentPage,
    loadTransactions,
    refresh,
  };
};

