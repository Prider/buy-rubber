import { useState, useCallback } from 'react';
import { getApiClient } from '@/shared/apiClient';
import { logger } from '@/shared/logger';
import { Member, MemberFormData, UseMembersReturn, PaginationInfo, DeleteMemberResponse } from '@/industries/rubber/types/member';

function apiErrorMessage(err: unknown, fallback: string): string {
  const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof apiError === 'string' && apiError.length > 0 ? apiError : fallback;
}

export const useMembers = (): UseMembersReturn => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const loadMembers = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const data = await getApiClient().get<{ members: Member[]; pagination: PaginationInfo }>(
        `/api/members?${params.toString()}`,
      );
      setMembers(data.members);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก'));
      logger.error('Failed to load members', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMember = useCallback(async (data: MemberFormData) => {
    try {
      setError(null);
      await getApiClient().post('/api/members', data);
      await loadMembers(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = apiErrorMessage(err, 'เกิดข้อผิดพลาดในการสร้างสมาชิก');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadMembers]);

  const updateMember = useCallback(async (id: string, data: MemberFormData) => {
    try {
      setError(null);
      await getApiClient().put(`/api/members/${id}`, data);
      await loadMembers(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = apiErrorMessage(err, 'เกิดข้อผิดพลาดในการอัปเดตสมาชิก');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadMembers]);

  const deleteMember = useCallback(async (id: string): Promise<DeleteMemberResponse> => {
    try {
      setError(null);
      const result = await getApiClient().delete<DeleteMemberResponse>(`/api/members/${id}`);
      await loadMembers(); // Refresh the list
      return result;
    } catch (err: unknown) {
      const errorMessage = apiErrorMessage(err, 'ไม่สามารถลบสมาชิกได้');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadMembers]);

  const reactivateMember = useCallback(async (id: string) => {
    try {
      setError(null);
      // Get the member first to preserve all data when updating
      const member = await getApiClient().get<Member>(`/api/members/${id}`);

      // Update member with isActive = true, preserving all other fields
      await getApiClient().put(`/api/members/${id}`, {
        name: member.name,
        idCard: member.idCard,
        phone: member.phone,
        address: member.address,
        bankAccount: member.bankAccount,
        bankName: member.bankName,
        ownerPercent: member.ownerPercent,
        tapperPercent: member.tapperPercent,
        tapperId: member.tapperId,
        tapperName: member.tapperName,
        isActive: true, // Reactivate the member
      });
      
      await loadMembers(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = apiErrorMessage(err, 'ไม่สามารถเปิดการใช้งานสมาชิกได้');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadMembers]);

  return {
    members,
    pagination,
    loading,
    error,
    loadMembers,
    createMember,
    updateMember,
    deleteMember,
    reactivateMember,
  };
};
