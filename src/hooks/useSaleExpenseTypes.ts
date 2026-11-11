import { useCallback, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { SaleExpenseTypeRecord } from '@/lib/saleExpenseTypes';

interface SaveSaleExpenseTypeInput {
  name: string;
}

export function useSaleExpenseTypes() {
  const [saleExpenseTypes, setSaleExpenseTypes] = useState<SaleExpenseTypeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSaleExpenseTypes = useCallback(async (includeInactive = false) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (includeInactive) {
        params.includeInactive = '1';
      }
      const response = await axios.get<SaleExpenseTypeRecord[]>('/api/sale-expense-types', { params });
      setSaleExpenseTypes(response.data);
      return response.data;
    } catch (err) {
      logger.error('Failed to load sale expense types', err);
      setError('ไม่สามารถโหลดชนิดค่าใช้จ่ายได้');
      return [];
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const createSaleExpenseType = useCallback(async (input: SaveSaleExpenseTypeInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post<SaleExpenseTypeRecord>('/api/sale-expense-types', input);
      setSaleExpenseTypes((current) => [...current, response.data]);
      return response.data;
    } catch (err) {
      logger.error('Failed to create sale expense type', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถสร้างชนิดค่าใช้จ่ายได้'
        : 'ไม่สามารถสร้างชนิดค่าใช้จ่ายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateSaleExpenseType = useCallback(async (id: string, input: SaveSaleExpenseTypeInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.put<SaleExpenseTypeRecord>(`/api/sale-expense-types/${id}`, input);
      setSaleExpenseTypes((current) =>
        current.map((type) => (type.id === id ? response.data : type)),
      );
      return response.data;
    } catch (err) {
      logger.error('Failed to update sale expense type', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถแก้ไขชนิดค่าใช้จ่ายได้'
        : 'ไม่สามารถแก้ไขชนิดค่าใช้จ่ายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteSaleExpenseType = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await axios.delete(`/api/sale-expense-types/${id}`);
      setSaleExpenseTypes((current) => current.filter((type) => type.id !== id));
    } catch (err) {
      logger.error('Failed to delete sale expense type', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถลบชนิดค่าใช้จ่ายได้'
        : 'ไม่สามารถลบชนิดค่าใช้จ่ายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    saleExpenseTypes,
    loading,
    loaded,
    saving,
    error,
    loadSaleExpenseTypes,
    createSaleExpenseType,
    updateSaleExpenseType,
    deleteSaleExpenseType,
    setError,
  };
}
