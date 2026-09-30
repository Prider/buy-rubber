import { useState, useCallback } from 'react';
import { getApiClient } from '@/shared/apiClient';
import { logger } from '@/shared/logger';
import {
  DestinationCompany,
  DestinationCompanyFormData,
  UseDestinationCompaniesReturn,
  PaginationInfo,
  DeleteDestinationCompanyResponse,
} from '@/industries/rubber/types/destinationCompany';

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

      const data = await getApiClient().get<{ companies: DestinationCompany[]; pagination: PaginationInfo }>(
        `/api/destination-companies?${params.toString()}`,
      );
      setCompanies(data.companies);
      setPagination(data.pagination);
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
        await getApiClient().post('/api/destination-companies', data);
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
        await getApiClient().put(`/api/destination-companies/${id}`, data);
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
        const result = await getApiClient().delete<DeleteDestinationCompanyResponse>(
          `/api/destination-companies/${id}`,
        );
        await loadCompanies();
        return result;
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
        const company = await getApiClient().get<DestinationCompany>(`/api/destination-companies/${id}`);

        await getApiClient().put(`/api/destination-companies/${id}`, {
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
