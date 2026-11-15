import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/hooks/useAlert';
import axios from 'axios';
import { canDeletePurchases } from '@/types/user';
import { PurchaseTransaction } from '../types';
import { printTransactionSlip, generateTransactionPDF } from '../utils/pdfGenerator';

interface UseTransactionActionsProps {
  onRefresh: () => Promise<void>;
}

export const useTransactionActions = ({ onRefresh }: UseTransactionActionsProps) => {
  const { user } = useAuth();
  const { showWarning, showSuccess, showError, showConfirm } = useAlert();
  const canDelete = canDeletePurchases(user?.role);

  const handlePrint = useCallback((transaction: PurchaseTransaction) => {
    printTransactionSlip(transaction);
  }, []);

  const handleDownloadPDF = useCallback(async (transaction: PurchaseTransaction) => {
    await generateTransactionPDF(transaction);
  }, []);

  const handleDelete = useCallback(async (transaction: PurchaseTransaction) => {
    if (!canDelete) {
      showWarning('ไม่มีสิทธิ์', 'เฉพาะเจ้าของและผู้จัดการเท่านั้นที่สามารถลบข้อมูลได้');
      return;
    }

    const confirmed = await showConfirm(
      'ยืนยันการลบรายการ',
      `คุณแน่ใจหรือไม่ว่าต้องการลบรายการ ${transaction.purchaseNo}?`,
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
      // Delete all purchases in this transaction
      for (const purchase of transaction.purchases) {
        await axios.delete(`/api/purchases/${purchase.id}`);
      }

      // Delete all service fees in this transaction
      for (const serviceFee of transaction.serviceFees) {
        await axios.delete(`/api/servicefees/${serviceFee.id}`);
      }

      await onRefresh();
      showSuccess('ลบข้อมูลเรียบร้อย', `ลบรายการ ${transaction.purchaseNo} เรียบร้อยแล้ว`, { autoClose: true, autoCloseDelay: 3000 });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล';
      showError('เกิดข้อผิดพลาด', errorMessage);
      console.error('Failed to delete transaction:', err);
    }
  }, [canDelete, onRefresh, showWarning, showSuccess, showError, showConfirm]);

  return {
    canDelete,
    handlePrint,
    handleDownloadPDF,
    handleDelete,
  };
};


