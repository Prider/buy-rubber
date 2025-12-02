import { useState, useCallback } from 'react';
import axios from 'axios';
import { PurchaseTransaction, PaginationInfo } from '@/components/purchases/types';

const ITEMS_PER_PAGE = 20;

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

  const loadTransactions = useCallback(async (page: number = 1, searchTerm?: string) => {
    try {
      setLoading(true);
      setError('');
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await axios.get(`/api/purchases/transactions?page=${page}&limit=${ITEMS_PER_PAGE}${searchParam}`);
      
      // Handle both old format (array) and new format (object with transactions and pagination)
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
        // Calculate pagination from array length
        const total = response.data.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        setPagination({
          page,
          limit: ITEMS_PER_PAGE,
          total,
          totalPages,
          hasMore: page < totalPages,
        });
      } else {
        setTransactions(response.data.transactions || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
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

