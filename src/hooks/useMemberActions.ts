import { useCallback } from 'react';
import { Member, MemberFormData, DeleteMemberResponse } from '@/types/member';

interface UseMemberActionsProps {
  deleteMember: (id: string) => Promise<DeleteMemberResponse>;
  reactivateMember: (id: string) => Promise<void>;
  updateMember: (id: string, data: MemberFormData) => Promise<void>;
  createMember: (data: MemberFormData) => Promise<void>;
  validateForm: () => string | null;
  closeForm: () => void;
}

/**
 * Custom hook for member action handlers
 * Separates business logic from UI components for better testability
 */
export const useMemberActions = ({
  deleteMember,
  reactivateMember,
  updateMember,
  createMember,
  validateForm,
  closeForm,
}: UseMemberActionsProps) => {
  const handleDelete = useCallback(async (member: Member) => {
    if (!confirm(`คุณต้องการลบสมาชิก "${member.name}" (${member.code}) หรือไม่?\n\nหมายเหตุ: หากสมาชิกมีประวัติการรับซื้อ ระบบจะปิดการใช้งานแทนการลบ`)) {
      return;
    }

    try {
      const result = await deleteMember(member.id);
      
      // Show appropriate message based on the response
      if (result.note) {
        alert(`✓ ${result.message}\n\n${result.note}`);
      } else {
        alert(`✓ ${result.message}`);
      }
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  }, [deleteMember]);

  const handleReactivate = useCallback(async (member: Member) => {
    if (!confirm(`คุณต้องการเปิดการใช้งานสมาชิก "${member.name}" (${member.code}) หรือไม่?`)) {
      return;
    }

    try {
      await reactivateMember(member.id);
      alert(`✓ เปิดการใช้งานสมาชิก "${member.name}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  }, [reactivateMember]);

  const handleSubmit = useCallback(async (data: MemberFormData, editingMember: Member | null) => {
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
  }, [validateForm, updateMember, createMember, closeForm]);

  return {
    handleDelete,
    handleReactivate,
    handleSubmit,
  };
};

