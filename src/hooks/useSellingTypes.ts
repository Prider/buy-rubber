import { useCallback, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { SellingTypeRecord } from '@/lib/sellingTypes';

interface SaveSellingTypeInput {
  name: string;
}

export function useSellingTypes() {
  const [sellingTypes, setSellingTypes] = useState<SellingTypeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSellingTypes = useCallback(async (includeInactive = false) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (includeInactive) {
        params.includeInactive = '1';
      }
      const response = await axios.get<SellingTypeRecord[]>('/api/selling-types', { params });
      setSellingTypes(response.data);
      return response.data;
    } catch (err) {
      logger.error('Failed to load selling types', err);
      setError('ไม่สามารถโหลดรูปแบบการขายได้');
      return [];
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const createSellingType = useCallback(async (input: SaveSellingTypeInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post<SellingTypeRecord>('/api/selling-types', input);
      setSellingTypes((current) => [...current, response.data]);
      return response.data;
    } catch (err) {
      logger.error('Failed to create selling type', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถสร้างรูปแบบการขายได้'
        : 'ไม่สามารถสร้างรูปแบบการขายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateSellingType = useCallback(async (id: string, input: SaveSellingTypeInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.put<SellingTypeRecord>(`/api/selling-types/${id}`, input);
      setSellingTypes((current) =>
        current.map((type) => (type.id === id ? response.data : type)),
      );
      return response.data;
    } catch (err) {
      logger.error('Failed to update selling type', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถแก้ไขรูปแบบการขายได้'
        : 'ไม่สามารถแก้ไขรูปแบบการขายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteSellingType = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await axios.delete(`/api/selling-types/${id}`);
      setSellingTypes((current) => current.filter((type) => type.id !== id));
    } catch (err) {
      logger.error('Failed to delete selling type', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถลบรูปแบบการขายได้'
        : 'ไม่สามารถลบรูปแบบการขายได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    sellingTypes,
    loading,
    loaded,
    saving,
    error,
    loadSellingTypes,
    createSellingType,
    updateSellingType,
    deleteSellingType,
    setError,
  };
}
