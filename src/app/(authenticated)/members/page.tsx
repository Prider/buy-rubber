'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MemberTable } from '@/industries/rubber/ui/members/MemberTable';
import { MembersPageHeader } from '@/industries/rubber/ui/members/MembersPageHeader';
import { MembersSearchBar } from '@/industries/rubber/ui/members/MembersSearchBar';
import { MembersPagination } from '@/industries/rubber/ui/members/MembersPagination';
import { MembersErrorDisplay } from '@/industries/rubber/ui/members/MembersErrorDisplay';
import { useMembers } from '@/industries/rubber/hooks/useMembers';
import { useMemberForm } from '@/industries/rubber/hooks/useMemberForm';
import { useMemberPageState } from '@/industries/rubber/hooks/useMemberPageState';
import { useMemberModals } from '@/industries/rubber/hooks/useMemberModals';
import { useMemberActions } from '@/industries/rubber/hooks/useMemberActions';
import { useMemberGroups } from '@/industries/rubber/hooks/useMemberGroups';
import { MemberFormData } from '@/industries/rubber/types/member';
import { useAuth } from '@/platform/AuthContext';
import GamerLoader from '@/shared/ui/GamerLoader';

const MemberForm = dynamic(
  () => import(/* webpackPrefetch: true */ '@/industries/rubber/ui/members/MemberForm').then((mod) => mod.MemberForm),
  { ssr: false, loading: () => null },
);

const MemberPurchaseHistoryModal = dynamic(
  () =>
    import('@/industries/rubber/ui/members/MemberPurchaseHistoryModal').then(
      (mod) => mod.MemberPurchaseHistoryModal
    ),
  { ssr: false, loading: () => null }
);

const MemberGroupModal = dynamic(
  () =>
    import('@/industries/rubber/ui/members/MemberGroupModal').then((mod) => mod.MemberGroupModal),
  { ssr: false, loading: () => null },
);

const MemberServiceFeeModal = dynamic(
  () =>
    import('@/industries/rubber/ui/members/MemberServiceFeeModal').then(
      (mod) => mod.MemberServiceFeeModal
    ),
  { ssr: false, loading: () => null }
);

export default function MembersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const { groups, productTypes, loadGroups, saveGroup, deleteGroup } = useMemberGroups();
  
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
    loadGroups();
  }, [user, authLoading, router, currentPage, debouncedSearchTerm, loadMembers, loadGroups]);

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
            onManageGroups={() => setIsGroupModalOpen(true)}
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
        groups={groups}
      />

      <MemberGroupModal
        isOpen={isGroupModalOpen}
        groups={groups}
        productTypes={productTypes}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={saveGroup}
        onDelete={deleteGroup}
        onChanged={() => loadMembers(currentPage, debouncedSearchTerm)}
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
