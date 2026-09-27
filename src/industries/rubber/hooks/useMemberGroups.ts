import { useCallback, useState } from 'react';
import { getApiClient } from '@/shared/apiClient';
import { logger } from '@/shared/logger';
import { MemberGroupRecord } from '@/industries/rubber/types/member';

export interface MemberGroupProductType {
  id: string;
  code: string;
  name: string;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof apiError === 'string' && apiError.length > 0 ? apiError : fallback;
}

export function useMemberGroups() {
  const [groups, setGroups] = useState<MemberGroupRecord[]>([]);
  const [productTypes, setProductTypes] = useState<MemberGroupProductType[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, typeData] = await Promise.all([
        getApiClient().get<MemberGroupRecord[]>('/api/member-groups'),
        getApiClient().get<MemberGroupProductType[]>('/api/product-types'),
      ]);
      setGroups(groupData);
      setProductTypes(typeData);
    } catch (err: unknown) {
      logger.error('Failed to load member groups', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGroup = useCallback(async (
    id: string | null,
    input: { name: string; prices: Array<{ productTypeId: string; price: number | '' }> },
  ) => {
    const prices = input.prices.filter((price) => price.price !== '');
    const payload = { name: input.name, prices };
    try {
      if (id) {
        await getApiClient().put(`/api/member-groups/${id}`, payload);
      } else {
        await getApiClient().post('/api/member-groups', payload);
      }
      await loadGroups();
    } catch (err: unknown) {
      throw new Error(apiErrorMessage(err, 'เกิดข้อผิดพลาดในการบันทึกกลุ่ม'));
    }
  }, [loadGroups]);

  const deleteGroup = useCallback(async (id: string) => {
    try {
      await getApiClient().delete(`/api/member-groups/${id}`);
      await loadGroups();
    } catch (err: unknown) {
      throw new Error(apiErrorMessage(err, 'เกิดข้อผิดพลาดในการลบกลุ่ม'));
    }
  }, [loadGroups]);

  return {
    groups,
    productTypes,
    loading,
    loadGroups,
    saveGroup,
    deleteGroup,
  };
}
