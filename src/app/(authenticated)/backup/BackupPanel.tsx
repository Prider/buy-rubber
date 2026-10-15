'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBackup, Backup } from '@/hooks/useBackup';
import { useAlert } from '@/hooks/useAlert';
import { showRestoreSuccessMessage, showResetSuccessMessage } from './utils';
import { BACKUP_PAGE_SIZE } from './constants';
import { BackupHeader } from './components/BackupHeader';
import { BackupList } from './components/BackupList';

export function BackupPanel() {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useAlert();
  const {
    loading,
    loadBackups,
    createBackup,
    restoreBackup,
    resetToInitialData,
    deleteBackup,
    downloadBackup,
  } = useBackup();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const refreshBackups = useCallback(async () => {
    try {
      const data = await loadBackups();
      setBackups(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  }, [loadBackups]);

  useEffect(() => {
    refreshBackups();
  }, [refreshBackups]);

  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const result = await createBackup('manual');
      if (result.success) {
        await refreshBackups();
        showSuccess('สำรองข้อมูลเรียบร้อย', 'การสำรองข้อมูลเสร็จสมบูรณ์แล้ว', { autoClose: true, autoCloseDelay: 3000 });
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสำรองข้อมูล';
      showError('เกิดข้อผิดพลาด', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (backup: Backup) => {
    const confirmed = await showConfirm(
      'ยืนยันการเรียกคืนข้อมูล',
      `คุณต้องการเรียกคืนข้อมูลจาก:\n${backup.fileName}\n\nการกระทำนี้จะแทนที่ข้อมูลปัจจุบันทั้งหมด`,
      {
        confirmText: 'เรียกคืนข้อมูล',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await restoreBackup(backup.id);
      if (result) {
        setActionLoading(false);
        showRestoreSuccessMessage(showSuccess);
      } else {
        setActionLoading(false);
      }
    } catch (err: unknown) {
      console.error('Failed to restore backup:', err);
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถเรียกคืนข้อมูลได้';
      showError('เกิดข้อผิดพลาด', errorMessage);
      setActionLoading(false);
    }
  };

  const handleResetToInitial = async () => {
    if (user?.role !== 'root') {
      return;
    }

    const confirmed = await showConfirm(
      'ยืนยันการรีเซ็ตข้อมูล',
      'คุณต้องการคืนข้อมูลกลับสู่สถานะเริ่มต้นหรือไม่?\n\nการกระทำนี้จะแทนที่ข้อมูลปัจจุบันทั้งหมด ระบบจะสำรองข้อมูลปัจจุบันไว้ก่อน',
      {
        confirmText: 'รีเซ็ตข้อมูล',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await resetToInitialData();
      if (result) {
        setActionLoading(false);
        showResetSuccessMessage(showSuccess);
      } else {
        setActionLoading(false);
      }
    } catch (err: unknown) {
      console.error('Failed to reset to initial data:', err);
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถรีเซ็ตข้อมูลเริ่มต้นได้';
      showError('เกิดข้อผิดพลาด', errorMessage);
      setActionLoading(false);
    }
  };

  const handleDownload = (backup: Backup) => {
    downloadBackup(backup.id);
  };

  const handleDelete = async (backup: Backup) => {
    const confirmed = await showConfirm(
      'ยืนยันการลบไฟล์สำรอง',
      `คุณต้องการลบไฟล์สำรอง:\n${backup.fileName}?`,
      {
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await deleteBackup(backup.id);
      if (result) {
        await refreshBackups();
        setActionLoading(false);
      } else {
        setActionLoading(false);
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบไฟล์สำรอง';
      showError('เกิดข้อผิดพลาด', errorMessage);
      setActionLoading(false);
    }
  };

  return (
    <div
      id="admin-tabpanel-backup"
      role="tabpanel"
      aria-labelledby="admin-tab-backup"
      className="space-y-6"
    >
      <BackupHeader
        onCreateBackup={handleCreateBackup}
        onResetToInitial={handleResetToInitial}
        canResetToInitial={user?.role === 'root'}
        loading={actionLoading}
      />
      <BackupList
        backups={backups}
        loading={loading && !actionLoading}
        actionLoading={actionLoading}
        currentPage={currentPage}
        pageSize={BACKUP_PAGE_SIZE}
        onPageChange={setCurrentPage}
        onRestore={handleRestore}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}
