import { useState, useCallback } from 'react';
import axios from 'axios';
import { Member, MemberFormData, UseMembersReturn, PaginationInfo } from '@/types/member';

export const useMembers = (): UseMembersReturn => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const loadMembers = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        active: 'true',
        page: page.toString(),
        limit: '50',
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await axios.get(`/api/members?${params.toString()}`);
      setMembers(response.data.members);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก');
      console.error('Load members error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMember = useCallback(async (data: MemberFormData) => {
    try {
      setError(null);
      await axios.post('/api/members', data);
      await loadMembers(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างสมาชิก';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadMembers]);

  const updateMember = useCallback(async (id: string, data: MemberFormData) => {
    try {
      setError(null);
      await axios.put(`/api/members/${id}`, data);
      await loadMembers(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตสมาชิก';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadMembers]);

  const deleteMember = useCallback(async (id: string) => {
    try {
      setError(null);
      await axios.delete(`/api/members/${id}`);
      await loadMembers(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'ไม่สามารถลบสมาชิกได้';
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
  };
};
