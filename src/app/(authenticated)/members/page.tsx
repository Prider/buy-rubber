'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MemberTable } from '@/components/members/MemberTable';
import { MembersPageHeader } from '@/components/members/MembersPageHeader';
import { MembersSearchBar } from '@/components/members/MembersSearchBar';
import { MembersPagination } from '@/components/members/MembersPagination';
import { MembersErrorDisplay } from '@/components/members/MembersErrorDisplay';
import { useMembers } from '@/hooks/useMembers';
import { useMemberForm } from '@/hooks/useMemberForm';
import { useMemberPageState } from '@/hooks/useMemberPageState';
import { useMemberModals } from '@/hooks/useMemberModals';
import { useMemberActions } from '@/hooks/useMemberActions';
import { MemberFormData } from '@/types/member';
import { useAuth } from '@/contexts/AuthContext';
import GamerLoader from '@/components/GamerLoader';

// Lazy load modals for better performance
const MemberForm = dynamic(
  () => import('@/components/members/MemberForm').then((mod) => mod.MemberForm),
  { ssr: false, loading: () => null }
);

const MemberPurchaseHistoryModal = dynamic(
  () =>
    import('@/components/members/MemberPurchaseHistoryModal').then(
      (mod) => mod.MemberPurchaseHistoryModal
    ),
  { ssr: false, loading: () => null }
);

const MemberServiceFeeModal = dynamic(
  () =>
    import('@/components/members/MemberServiceFeeModal').then(
      (mod) => mod.MemberServiceFeeModal
    ),
  { ssr: false, loading: () => null }
);

export default function MembersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Page state management (search, pagination, auto-open)
  const {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    shouldAutoOpen,
    setShouldAutoOpen,
    clearSearch,
  } = useMemberPageState();

  // Members data and operations
  const {
    members,
    pagination,
    loading: membersLoading,
    error,
    loadMembers,
    createMember,
    updateMember,
    deleteMember,
    reactivateMember,
  } = useMembers();
  
  // Form state management
  const {
    isOpen: isFormOpen,
    editingMember,
    formData,
    openFormForNew,
    openFormForEdit,
    closeForm,
    updateFormData,
    validateForm,
  } = useMemberForm(members);

  // Modal state management
  const {
    historyModal,
    serviceFeeModal,
  } = useMemberModals();

  // Action handlers
  const {
    handleDelete,
    handleReactivate,
    handleSubmit,
  } = useMemberActions({
    deleteMember,
    reactivateMember,
    updateMember,
    createMember,
    validateForm,
    closeForm,
  });

  // Load members when page or debounced search changes
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadMembers(currentPage, debouncedSearchTerm);
  }, [user, authLoading, router, currentPage, debouncedSearchTerm, loadMembers]);

  // Auto-open form modal if needed (from URL query param)
  useEffect(() => {
    if (shouldAutoOpen && !membersLoading && members.length >= 0) {
      const timer = setTimeout(() => {
        openFormForNew();
        setShouldAutoOpen(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpen, membersLoading, members.length, openFormForNew, setShouldAutoOpen]);

  // Show loader while auth is loading
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
          {/* Page Header */}
          <MembersPageHeader
            totalMembers={pagination.total}
            onAddMember={openFormForNew}
          />

          {/* Search Bar */}
          <MembersSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearSearch={clearSearch}
            isLoading={membersLoading}
            resultCount={members.length}
            totalCount={pagination.total}
          />

          {/* Main Content */}
          <div className="space-y-2">
            {/* Error Display */}
            <MembersErrorDisplay error={error || ''} />

            {/* Members Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <MemberTable
                members={members}
                onEdit={openFormForEdit}
                onDelete={handleDelete}
                onReactivate={handleReactivate}
                onViewHistory={historyModal.open}
                onViewServiceFees={serviceFeeModal.open}
                isLoading={membersLoading}
              />
            </div>

            {/* Pagination Controls */}
            <MembersPagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isLoading={membersLoading}
            />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <MemberForm
        isOpen={isFormOpen}
        editingMember={editingMember}
        formData={formData}
        onSubmit={(data: MemberFormData) => handleSubmit(data, editingMember)}
        onCancel={closeForm}
        onFormDataChange={updateFormData}
        isLoading={membersLoading}
      />

      {/* Purchase History Modal */}
      <MemberPurchaseHistoryModal
        isOpen={historyModal.isOpen}
        member={historyModal.member}
        onClose={historyModal.close}
      />

      {/* Service Fee Modal */}
      <MemberServiceFeeModal
        isOpen={serviceFeeModal.isOpen}
        member={serviceFeeModal.member}
        onClose={serviceFeeModal.close}
      />
    </>
  );
}
