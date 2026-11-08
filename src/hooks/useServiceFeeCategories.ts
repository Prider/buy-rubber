import { useCallback, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { ServiceFeeCategoryRecord } from '@/lib/serviceFeeCategories';

interface SaveServiceFeeCategoryInput {
  name: string;
}

export function useServiceFeeCategories() {
  const [categories, setCategories] = useState<ServiceFeeCategoryRecord[]>([]);
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
      const response = await axios.get<ServiceFeeCategoryRecord[]>(
        '/api/service-fee-categories',
        { params },
      );
      setCategories(response.data);
      return response.data;
    } catch (err) {
      logger.error('Failed to load service fee categories', err);
      setError('ไม่สามารถโหลดประเภทค่าบริการได้');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (input: SaveServiceFeeCategoryInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post<ServiceFeeCategoryRecord>(
        '/api/service-fee-categories',
        input,
      );
      setCategories((current) => [...current, response.data]);
      return response.data;
    } catch (err) {
      logger.error('Failed to create service fee category', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถสร้างประเภทค่าบริการได้'
        : 'ไม่สามารถสร้างประเภทค่าบริการได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, input: SaveServiceFeeCategoryInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.put<ServiceFeeCategoryRecord>(
        `/api/service-fee-categories/${id}`,
        input,
      );
      setCategories((current) =>
        current.map((category) => (category.id === id ? response.data : category)),
      );
      return response.data;
    } catch (err) {
      logger.error('Failed to update service fee category', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถแก้ไขประเภทค่าบริการได้'
        : 'ไม่สามารถแก้ไขประเภทค่าบริการได้';
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
      await axios.delete(`/api/service-fee-categories/${id}`);
      setCategories((current) => current.filter((category) => category.id !== id));
    } catch (err) {
      logger.error('Failed to delete service fee category', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถลบประเภทค่าบริการได้'
        : 'ไม่สามารถลบประเภทค่าบริการได้';
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
