'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DestinationCompanyTable } from '@/components/destination-companies/DestinationCompanyTable';
import { DestinationCompaniesPageHeader } from '@/components/destination-companies/DestinationCompaniesPageHeader';
import { MembersSearchBar } from '@/components/members/MembersSearchBar';
import { MembersPagination } from '@/components/members/MembersPagination';
import { MembersErrorDisplay } from '@/components/members/MembersErrorDisplay';
import { useDestinationCompanies } from '@/hooks/useDestinationCompanies';
import { useDestinationCompanyForm } from '@/hooks/useDestinationCompanyForm';
import { useDestinationCompanyPageState } from '@/hooks/useDestinationCompanyPageState';
import { useDestinationCompanyActions } from '@/hooks/useDestinationCompanyActions';
import { DestinationCompanyFormData } from '@/types/destinationCompany';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';

const DestinationCompanyForm = dynamic(
  () =>
    import(/* webpackPrefetch: true */ '@/components/destination-companies/DestinationCompanyForm').then(
      (mod) => mod.DestinationCompanyForm,
    ),
  { ssr: false, loading: () => null },
);

export default function DestinationCompaniesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    shouldAutoOpen,
    setShouldAutoOpen,
    clearSearch,
  } = useDestinationCompanyPageState();

  const {
    companies,
    pagination,
    loading: companiesLoading,
    error,
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    reactivateCompany,
  } = useDestinationCompanies();

  const {
    isOpen: isFormOpen,
    editingCompany,
    formData,
    openFormForNew,
    openFormForEdit,
    closeForm,
    updateFormData,
    validateForm,
  } = useDestinationCompanyForm(companies);

  const { handleDelete, handleReactivate, handleSubmit } = useDestinationCompanyActions({
    deleteCompany,
    reactivateCompany,
    updateCompany,
    createCompany,
    validateForm,
    closeForm,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadCompanies(currentPage, debouncedSearchTerm);
  }, [user, authLoading, router, currentPage, debouncedSearchTerm, loadCompanies]);

  useEffect(() => {
    if (shouldAutoOpen && !companiesLoading) {
      const timer = setTimeout(() => {
        openFormForNew();
        setShouldAutoOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpen, companiesLoading, openFormForNew, setShouldAutoOpen]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div>
          <DestinationCompaniesPageHeader
            totalCompanies={pagination.total}
            onAddCompany={openFormForNew}
          />

          <MembersSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearSearch={clearSearch}
            isLoading={companiesLoading}
            resultCount={companies.length}
            totalCount={pagination.total}
            placeholder="ค้นหาบริษัทตามชื่อ, รหัส, เบอร์โทร หรือที่อยู่..."
          />

          <div className="space-y-2">
            <MembersErrorDisplay error={error || ''} />

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <DestinationCompanyTable
                companies={companies}
                onEdit={openFormForEdit}
                onDelete={handleDelete}
                onReactivate={handleReactivate}
                isLoading={companiesLoading}
              />
            </div>

            <MembersPagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isLoading={companiesLoading}
            />
          </div>
        </div>
      </div>

      <DestinationCompanyForm
        isOpen={isFormOpen}
        editingCompany={editingCompany}
        formData={formData}
        onSubmit={(data: DestinationCompanyFormData) => handleSubmit(data, editingCompany)}
        onCancel={closeForm}
        onFormDataChange={updateFormData}
        isLoading={companiesLoading}
      />
    </>
  );
}
