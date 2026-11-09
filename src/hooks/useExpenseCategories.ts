import { useCallback, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { ExpenseCategoryRecord } from '@/lib/expenseCategories';

interface SaveExpenseCategoryInput {
  name: string;
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (includeInactive = false) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (includeInactive) {
        params.includeInactive = '1';
      }
      const response = await axios.get<ExpenseCategoryRecord[]>('/api/expense-categories', {
        params,
      });
      setCategories(response.data);
      return response.data;
    } catch (err) {
      logger.error('Failed to load expense categories', err);
      setError('ไม่สามารถโหลดประเภทค่าใช้จ่ายได้');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (input: SaveExpenseCategoryInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post<ExpenseCategoryRecord>('/api/expense-categories', input);
      setCategories((current) => [...current, response.data]);
      return response.data;
    } catch (err) {
      logger.error('Failed to create expense category', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถสร้างประเภทค่าใช้จ่ายได้'
        : 'ไม่สามารถสร้างประเภทค่าใช้จ่ายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, input: SaveExpenseCategoryInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.put<ExpenseCategoryRecord>(`/api/expense-categories/${id}`, input);
      setCategories((current) =>
        current.map((category) => (category.id === id ? response.data : category)),
      );
      return response.data;
    } catch (err) {
      logger.error('Failed to update expense category', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถแก้ไขประเภทค่าใช้จ่ายได้'
        : 'ไม่สามารถแก้ไขประเภทค่าใช้จ่ายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await axios.delete(`/api/expense-categories/${id}`);
      setCategories((current) => current.filter((category) => category.id !== id));
    } catch (err) {
      logger.error('Failed to delete expense category', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถลบประเภทค่าใช้จ่ายได้'
        : 'ไม่สามารถลบประเภทค่าใช้จ่ายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    categories,
    loading,
    saving,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setError,
  };
}
