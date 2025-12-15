'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBackup, Backup } from '@/hooks/useBackup';
import { useAlert } from '@/hooks/useAlert';
// import { useBackupSettings } from './hooks/useBackupSettings';
import { showRestoreSuccessMessage } from './utils';
import { BACKUP_PAGE_SIZE } from './constants';
import { BackupHeader } from './components/BackupHeader';
// import { BackupSettings } from './components/BackupSettings';
import { BackupList } from './components/BackupList';
import GamerLoader from '@/components/GamerLoader';

export default function BackupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useAlert();
  const [isElectron, setIsElectron] = useState(false);
  const {
    loading,
    // error,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
  } = useBackup();
  
  // const {
  //   settings,
  //   loading: settingsLoading,
  //   updateSettings,
  //   saveSettings,
  // } = useBackupSettings();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [electronCheckComplete, setElectronCheckComplete] = useState(false);

  // Check if running in Electron
  useEffect(() => {
    const checkElectron = () => {
      const isElectronEnv = typeof window !== 'undefined' && window.electron?.isElectron === true;
      setIsElectron(isElectronEnv);
      setElectronCheckComplete(true);
    };
    
    // Check immediately
    checkElectron();
    
    // Also check after a short delay in case electron object loads asynchronously
    const timeout = setTimeout(checkElectron, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  // Redirect if not admin or not in Electron (wait for Electron check to complete)
  useEffect(() => {
    // Wait for Electron check to complete before redirecting
    if (!electronCheckComplete) {
      return;
    }
    
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (!isElectron) {
      router.push('/dashboard');
      return;
    }
  }, [user, router, isElectron, electronCheckComplete]);

  // Refresh backups list
  const refreshBackups = useCallback(async () => {
    try {
      const data = await loadBackups();
      setBackups(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  }, [loadBackups]);

  // Load backups on mount
  useEffect(() => {
    refreshBackups();
  }, [refreshBackups]);

  // Handle create backup
  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const result = await createBackup('manual');
      if (result.success) {
        // Refresh backups first
        await refreshBackups();
        // Show success message (non-blocking)
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

  // Handle restore backup
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

  // Handle download backup
  const handleDownload = (backup: Backup) => {
    downloadBackup(backup.id);
  };

  // Handle delete backup
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
        // Refresh backups first, then reset loading
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

  // Don't render if Electron check not complete, not admin, or not in Electron
  if (!electronCheckComplete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }
  if (user && user.role !== 'admin') {
    return null;
  }
  if (!isElectron) {
    return null;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <BackupHeader onCreateBackup={handleCreateBackup} loading={actionLoading} />

      {/* Error Message */}
      {/* {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )} */}

      {/* Auto Backup Settings */}
      {/* <BackupSettings
        settings={settings}
        loading={settingsLoading}
        onUpdate={updateSettings}
        onSave={saveSettings}
      /> */}

      {/* Backups List */}
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
