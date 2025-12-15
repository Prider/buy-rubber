import { useCallback } from 'react';
import { useAlert } from '@/hooks/useAlert';
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
  const { showSuccess, showError, showConfirm } = useAlert();
  const handleDelete = useCallback(async (member: Member) => {
    const confirmed = await showConfirm(
      'ยืนยันการลบสมาชิก',
      `คุณต้องการลบสมาชิก "${member.name}" (${member.code}) หรือไม่?\n\nหมายเหตุ: หากสมาชิกมีประวัติการรับซื้อ ระบบจะปิดการใช้งานแทนการลบ`,
      {
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteMember(member.id);
      
      // Show appropriate message based on the response
      if (result.note) {
        showSuccess('ลบสมาชิกสำเร็จ', `${result.message}\n\n${result.note}`, { autoClose: true, autoCloseDelay: 5000 });
      } else {
        showSuccess('ลบสมาชิกสำเร็จ', result.message, { autoClose: true, autoCloseDelay: 3000 });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบสมาชิก';
      showError('เกิดข้อผิดพลาด', errorMessage);
    }
  }, [deleteMember, showSuccess, showError, showConfirm]);

  const handleReactivate = useCallback(async (member: Member) => {
    const confirmed = await showConfirm(
      'ยืนยันการเปิดการใช้งาน',
      `คุณต้องการเปิดการใช้งานสมาชิก "${member.name}" (${member.code}) หรือไม่?`,
      {
        confirmText: 'เปิดใช้งาน',
        cancelText: 'ยกเลิก',
        variant: 'info',
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      await reactivateMember(member.id);
      showSuccess('เปิดการใช้งานสำเร็จ', `เปิดการใช้งานสมาชิก "${member.name}" เรียบร้อยแล้ว`, { autoClose: true, autoCloseDelay: 3000 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปิดการใช้งานสมาชิก';
      showError('เกิดข้อผิดพลาด', errorMessage);
    }
  }, [reactivateMember, showSuccess, showError, showConfirm]);

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

