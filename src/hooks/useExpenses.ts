import { useState, useCallback, useEffect, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { logger } from '@/lib/logger';

export interface Expense {
  id: string;
  expenseNo: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  avgDaily: number;
  avgCount: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface LoadExpensesOptions {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'ค่าน้ำมัน', label: 'ค่าน้ำมัน' },
  { value: 'ค่าซ่อมรถ', label: 'ค่าซ่อมรถ' },
  { value: 'ค่าคนงาน', label: 'ค่าคนงาน' },
  { value: 'อื่นๆ', label: 'อื่นๆ' },
];

const DEFAULT_PAGE_SIZE = 10;

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    todayTotal: 0,
    todayCount: 0,
    monthTotal: 0,
    monthCount: 0,
    avgDaily: 0,
    avgCount: 0,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const loadExpenses = useCallback(async (options: LoadExpensesOptions = {}) => {
    // Cancel previous request if it exists
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New request initiated');
    }
    
    const cancelToken = axios.CancelToken.source();
    cancelTokenRef.current = cancelToken;
    
    try {
      setLoading(true);
      setError(null);

      const page = options.page ?? 1;
      const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

      const params: Record<string, string | number> = {
        page,
        pageSize,
      };

      if (options.startDate) {
        params.startDate = options.startDate;
      }
      if (options.endDate) {
        params.endDate = options.endDate;
      }
      if (options.category) {
        params.category = options.category;
      }

      const response = await axios.get('/api/expenses', { 
        params,
        cancelToken: cancelToken.token,
      });
      
      // Only update state if request wasn't cancelled
      setExpenses(response.data.expenses || []);
      setSummary(response.data.summary || {
        todayTotal: 0,
        todayCount: 0,
        monthTotal: 0,
        monthCount: 0,
        avgDaily: 0,
        avgCount: 0,
      });

      const paginationData = response.data.pagination;
      if (paginationData) {
        setPagination({
          page: paginationData.page ?? page,
          pageSize: paginationData.pageSize ?? pageSize,
          total: paginationData.total ?? 0,
          totalPages: paginationData.totalPages ?? Math.max(1, Math.ceil((paginationData.total ?? 0) / (paginationData.pageSize ?? pageSize))),
        });
      } else {
        const total = response.data.expenses?.length || 0;
        setPagination({
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        });
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        logger.debug('Expenses load cancelled');
        return;
      }
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลค่าใช้จ่าย');
      logger.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
      if (cancelTokenRef.current === cancelToken) {
        cancelTokenRef.current = null;
      }
    }
  }, []);

  const createExpense = useCallback(async (expenseData: any) => {
    try {
      setError(null);
      await axios.post('/api/expenses', expenseData);
      await loadExpenses({ page: 1, pageSize: pagination.pageSize });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadExpenses, pagination.pageSize]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      setError(null);
      await axios.delete(`/api/expenses/${id}`);
      await loadExpenses({ page: pagination.page, pageSize: pagination.pageSize });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบค่าใช้จ่าย';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadExpenses, pagination.page, pagination.pageSize]);

  const changePage = useCallback(async (page: number) => {
    await loadExpenses({ page, pageSize: pagination.pageSize });
  }, [loadExpenses, pagination.pageSize]);

  const changePageSize = useCallback(async (pageSize: number) => {
    await loadExpenses({ page: 1, pageSize });
  }, [loadExpenses]);

  return {
    expenses,
    summary,
    loading,
    error,
    pagination,
    loadExpenses,
    createExpense,
    deleteExpense,
    changePage,
    changePageSize,
    categories: EXPENSE_CATEGORIES,
  };
};


