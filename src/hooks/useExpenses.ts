import { useState, useCallback } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';

export interface Expense {
  id: string;
  expenseNo: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
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

const EXPENSE_CATEGORIES = [
  { value: 'ค่าน้ำมัน', label: 'ค่าน้ำมัน' },
  { value: 'ค่าซ่อมรถ', label: 'ค่าซ่อมรถ' },
  { value: 'ค่าคนงาน', label: 'ค่าคนงาน' },
  { value: 'อื่นๆ', label: 'อื่นๆ' },
];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/expenses');
      setExpenses(response.data.expenses || []);
      setSummary(response.data.summary || {
        todayTotal: 0,
        todayCount: 0,
        monthTotal: 0,
        monthCount: 0,
        avgDaily: 0,
        avgCount: 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลค่าใช้จ่าย');
      logger.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expenseData: any) => {
    try {
      setError(null);
      await axios.post('/api/expenses', expenseData);
      await loadExpenses(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      setError(null);
      await axios.delete(`/api/expenses/${id}`);
      await loadExpenses(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบค่าใช้จ่าย';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadExpenses]);

  return {
    expenses,
    summary,
    loading,
    error,
    loadExpenses,
    createExpense,
    deleteExpense,
    categories: EXPENSE_CATEGORIES,
  };
};


