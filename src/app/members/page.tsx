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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">จัดการสมาชิก</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ข้อมูลเจ้าของสวนและคนตัดยาง
            </p>
          </div>
          <button
            onClick={openFormForNew}
            className="btn btn-primary"
          >
            + เพิ่มสมาชิก
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        {/* Members Table */}
        <MemberTable
          members={members}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={loading}
        />

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
      </div>
    </Layout>
  );
}

