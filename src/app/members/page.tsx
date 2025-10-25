'use client';

import { useEffect, useState, useMemo } from 'react';
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
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) {
      return members;
    }
    
    const term = searchTerm.toLowerCase();
    return members.filter(member => 
      member.name.toLowerCase().includes(term) ||
      member.code.toLowerCase().includes(term) ||
      (member.phone && member.phone.includes(term)) ||
      (member.address && member.address.toLowerCase().includes(term)) ||
      (member.tapperName && member.tapperName.toLowerCase().includes(term))
    );
  }, [members, searchTerm]);

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
        <div className="max-w-7xlmx-auto px-4 sm:px-4 lg:px-4 py-4">
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
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/purchases')} 
                  className="group relative px-5 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>กลับไปหน้ารับซื้อ</span>
                  </div>
                </button>
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
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="ค้นหาสมาชิกตามชื่อ, รหัส, เบอร์โทร, ที่อยู่ หรือชื่อคนตัด..."
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {searchTerm ? (
                        <span>
                          พบ <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredMembers.length}</span> รายการ
                          {filteredMembers.length !== members.length && (
                            <span> จากทั้งหมด {members.length} รายการ</span>
                          )}
                        </span>
                      ) : (
                        <span>ทั้งหมด <span className="font-semibold text-blue-600 dark:text-blue-400">{members.length}</span> รายการ</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                members={filteredMembers}
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

