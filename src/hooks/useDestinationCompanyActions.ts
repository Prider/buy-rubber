import { useCallback } from 'react';
import { useAlert } from '@/hooks/useAlert';
import {
  DestinationCompany,
  DestinationCompanyFormData,
  DeleteDestinationCompanyResponse,
} from '@/types/destinationCompany';

interface UseDestinationCompanyActionsProps {
  deleteCompany: (id: string) => Promise<DeleteDestinationCompanyResponse>;
  reactivateCompany: (id: string) => Promise<void>;
  updateCompany: (id: string, data: DestinationCompanyFormData) => Promise<void>;
  createCompany: (data: DestinationCompanyFormData) => Promise<void>;
  validateForm: () => string | null;
  closeForm: () => void;
}

export const useDestinationCompanyActions = ({
  deleteCompany,
  reactivateCompany,
  updateCompany,
  createCompany,
  validateForm,
  closeForm,
}: UseDestinationCompanyActionsProps) => {
  const { showSuccess, showError, showConfirm } = useAlert();

  const handleDelete = useCallback(
    async (company: DestinationCompany) => {
      const confirmed = await showConfirm(
        'ยืนยันการลบบริษัทปลายทาง',
        `คุณต้องการลบบริษัท "${company.name}" (${company.code}) หรือไม่?\n\nหมายเหตุ: หากบริษัทมีประวัติการขาย ระบบจะปิดการใช้งานแทนการลบ`,
        {
          confirmText: 'ลบ',
          cancelText: 'ยกเลิก',
          variant: 'danger',
        },
      );
      if (!confirmed) return;

      try {
        const result = await deleteCompany(company.id);
        if (result.note) {
          showSuccess('ลบบริษัทสำเร็จ', `${result.message}\n\n${result.note}`, {
            autoClose: true,
            autoCloseDelay: 5000,
          });
        } else {
          showSuccess('ลบบริษัทสำเร็จ', result.message, { autoClose: true, autoCloseDelay: 3000 });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบบริษัท';
        showError('เกิดข้อผิดพลาด', errorMessage);
      }
    },
    [deleteCompany, showSuccess, showError, showConfirm],
  );

  const handleReactivate = useCallback(
    async (company: DestinationCompany) => {
      const confirmed = await showConfirm(
        'ยืนยันการเปิดการใช้งาน',
        `คุณต้องการเปิดการใช้งานบริษัท "${company.name}" (${company.code}) หรือไม่?`,
        {
          confirmText: 'เปิดใช้งาน',
          cancelText: 'ยกเลิก',
          variant: 'info',
        },
      );
      if (!confirmed) return;

      try {
        await reactivateCompany(company.id);
        showSuccess('เปิดการใช้งานสำเร็จ', `เปิดการใช้งานบริษัท "${company.name}" เรียบร้อยแล้ว`, {
          autoClose: true,
          autoCloseDelay: 3000,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปิดการใช้งานบริษัท';
        showError('เกิดข้อผิดพลาด', errorMessage);
      }
    },
    [reactivateCompany, showSuccess, showError, showConfirm],
  );

  const handleSubmit = useCallback(
    async (data: DestinationCompanyFormData, editingCompany: DestinationCompany | null) => {
      const validationError = validateForm();
      if (validationError) {
        throw new Error(validationError);
      }

      try {
        if (editingCompany) {
          await updateCompany(editingCompany.id, data);
          showSuccess('แก้ไขสำเร็จ', `แก้ไขบริษัท "${data.name}" เรียบร้อยแล้ว`, {
            autoClose: true,
            autoCloseDelay: 3000,
          });
        } else {
          await createCompany(data);
          showSuccess('เพิ่มสำเร็จ', `เพิ่มบริษัท "${data.name}" เรียบร้อยแล้ว`, {
            autoClose: true,
            autoCloseDelay: 3000,
          });
        }
        closeForm();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        throw new Error(errorMessage);
      }
    },
    [validateForm, updateCompany, createCompany, closeForm, showSuccess],
  );

  return {
    handleDelete,
    handleReactivate,
    handleSubmit,
  };
};
