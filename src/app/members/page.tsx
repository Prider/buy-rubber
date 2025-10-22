'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { MemberTable } from '@/components/members/MemberTable';
import { MemberForm } from '@/components/members/MemberForm';
import { useMembers } from '@/hooks/useMembers';
import { useMemberForm } from '@/hooks/useMemberForm';
import { MemberFormData } from '@/types/member';
import { useAuth } from '@/contexts/AuthContext';

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { members, loading, error, loadMembers, createMember, updateMember, deleteMember } = useMembers();
  const {
    isOpen,
    editingMember,
    formData,
    openFormForNew,
    openFormForEdit,
    closeForm,
    updateFormData,
    validateForm,
  } = useMemberForm(members);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadMembers();
  }, [user, router, loadMembers]);

  const handleSubmit = async (data: MemberFormData) => {
    const validationError = validateForm();
    if (validationError) {
      throw new Error(validationError);
    }

    if (editingMember) {
      await updateMember(editingMember.id, data);
    } else {
      await createMember(data);
    }
    closeForm();
  };

  const handleEdit = (member: any) => {
    openFormForEdit(member);
  };

  const handleDelete = async (member: any) => {
    if (!confirm(`คุณต้องการลบสมาชิก "${member.name}" (${member.code}) หรือไม่?\n\nการลบนี้ไม่สามารถกู้คืนได้`)) {
      return;
    }

    try {
      await deleteMember(member.id);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      จัดการสมาชิก
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      ข้อมูลเจ้าของสวนและคนตัดยาง
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={openFormForNew} 
                className="group relative px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>เพิ่มสมาชิก</span>
                </div>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-2">
            {/* Error Display */}
            {error && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">เกิดข้อผิดพลาด</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <MemberTable
                members={members}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <MemberForm
        isOpen={isOpen}
        editingMember={editingMember}
        formData={formData}
        onSubmit={handleSubmit}
        onCancel={closeForm}
        onFormDataChange={updateFormData}
        isLoading={loading}
      />
    </Layout>
  );
}

