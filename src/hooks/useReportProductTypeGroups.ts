import { useCallback, useState } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { ReportProductTypeGroupRecord } from '@/lib/reportProductTypeGroups';

interface SaveReportGroupInput {
  name?: string;
  productTypeIds: string[];
}

export function useReportProductTypeGroups() {
  const [groups, setGroups] = useState<ReportProductTypeGroupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async (includeInactive = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = includeInactive ? { includeInactive: '1' } : undefined;
      const response = await axios.get<ReportProductTypeGroupRecord[]>(
        '/api/report-product-type-groups',
        { params },
      );
      setGroups(response.data);
      return response.data;
    } catch (err) {
      logger.error('Failed to load report product type groups', err);
      setError('ไม่สามารถโหลดกลุ่มรายงานได้');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (input: SaveReportGroupInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post<ReportProductTypeGroupRecord>(
        '/api/report-product-type-groups',
        input,
      );
      setGroups((current) => [...current, response.data]);
      return response.data;
    } catch (err) {
      logger.error('Failed to create report product type group', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถสร้างกลุ่มรายงานได้'
        : 'ไม่สามารถสร้างกลุ่มรายงานได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateGroup = useCallback(async (id: string, input: SaveReportGroupInput) => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.put<ReportProductTypeGroupRecord>(
        `/api/report-product-type-groups/${id}`,
        input,
      );
      setGroups((current) =>
        current.map((group) => (group.id === id ? response.data : group)),
      );
      return response.data;
    } catch (err) {
      logger.error('Failed to update report product type group', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถแก้ไขกลุ่มรายงานได้'
        : 'ไม่สามารถแก้ไขกลุ่มรายงานได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await axios.delete(`/api/report-product-type-groups/${id}`);
      setGroups((current) => current.filter((group) => group.id !== id));
    } catch (err) {
      logger.error('Failed to delete report product type group', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'ไม่สามารถลบกลุ่มรายงานได้'
        : 'ไม่สามารถลบกลุ่มรายงานได้';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    groups,
    loading,
    saving,
    error,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    setError,
  };
}
