'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { DestinationCompanyTable } from '@/components/destination-companies/DestinationCompanyTable';
import { DestinationCompaniesPageHeader } from '@/components/destination-companies/DestinationCompaniesPageHeader';
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
      <div className="flex min-w-0 flex-col lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div className="relative z-0 flex min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 lg:min-h-0 lg:flex-1">
            <DestinationCompaniesPageHeader
              onAddCompany={openFormForNew}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClearSearch={clearSearch}
              isLoading={companiesLoading}
              resultCount={companies.length}
              totalCount={pagination.total}
            />

            <MembersErrorDisplay error={error || ''} />

            <div className="lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto">
              <DestinationCompanyTable
                companies={companies}
                onEdit={openFormForEdit}
                onDelete={handleDelete}
                onReactivate={handleReactivate}
                isLoading={companiesLoading}
              />
            </div>

            <MembersPagination
              embedded
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
