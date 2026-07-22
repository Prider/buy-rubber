import { useState, useCallback } from 'react';
import axios from 'axios';
import { logger } from '@/lib/logger';
import {
  DestinationCompany,
  DestinationCompanyFormData,
  UseDestinationCompaniesReturn,
  PaginationInfo,
  DeleteDestinationCompanyResponse,
} from '@/types/destinationCompany';

const PAGE_SIZE = 10;

export const useDestinationCompanies = (): UseDestinationCompaniesReturn => {
  const [companies, setCompanies] = useState<DestinationCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const loadCompanies = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: String(PAGE_SIZE),
      });
      if (search) params.append('search', search);

      const response = await axios.get(`/api/destination-companies?${params.toString()}`);
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลบริษัทปลายทาง');
      logger.error('Failed to load destination companies', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompany = useCallback(
    async (data: DestinationCompanyFormData) => {
      try {
        setError(null);
        await axios.post('/api/destination-companies', data);
        await loadCompanies();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const errorMessage = axiosErr.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างบริษัทปลายทาง';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadCompanies],
  );

  const updateCompany = useCallback(
    async (id: string, data: DestinationCompanyFormData) => {
      try {
        setError(null);
        await axios.put(`/api/destination-companies/${id}`, data);
        await loadCompanies();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const errorMessage = axiosErr.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตบริษัทปลายทาง';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadCompanies],
  );

  const deleteCompany = useCallback(
    async (id: string): Promise<DeleteDestinationCompanyResponse> => {
      try {
        setError(null);
        const response = await axios.delete(`/api/destination-companies/${id}`);
        await loadCompanies();
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const errorMessage = axiosErr.response?.data?.error || 'ไม่สามารถลบบริษัทปลายทางได้';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadCompanies],
  );

  const reactivateCompany = useCallback(
    async (id: string) => {
      try {
        setError(null);
        const companyResponse = await axios.get(`/api/destination-companies/${id}`);
        const company = companyResponse.data as DestinationCompany;

        await axios.put(`/api/destination-companies/${id}`, {
          name: company.name,
          phone: company.phone || '',
          address: company.address || '',
          isActive: true,
        });

        await loadCompanies();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const errorMessage = axiosErr.response?.data?.error || 'ไม่สามารถเปิดการใช้งานบริษัทปลายทางได้';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [loadCompanies],
  );

  return {
    companies,
    pagination,
    loading,
    error,
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    reactivateCompany,
  };
};
