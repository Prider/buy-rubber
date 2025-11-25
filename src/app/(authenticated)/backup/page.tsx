'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBackup, Backup } from '@/hooks/useBackup';
import { useBackupSettings } from './hooks/useBackupSettings';
import { showRestoreSuccessMessage } from './utils';
import { BACKUP_PAGE_SIZE } from './constants';
import { BackupHeader } from './components/BackupHeader';
import { BackupSettings } from './components/BackupSettings';
import { BackupList } from './components/BackupList';

export default function BackupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    loading,
    error,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
  } = useBackup();
  
  const {
    settings,
    loading: settingsLoading,
    updateSettings,
    saveSettings,
  } = useBackupSettings();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

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
        alert('สำรองข้อมูลเรียบร้อย!');
        await refreshBackups();
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert('❌ เกิดข้อผิดพลาดในการสำรองข้อมูล');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle restore backup
  const handleRestore = async (backup: Backup) => {
    if (!confirm(
      `คุณต้องการเรียกคืนข้อมูลจาก:\n${backup.fileName}\n\n` +
      'การกระทำนี้จะแทนที่ข้อมูลปัจจุบันทั้งหมด'
    )) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await restoreBackup(backup.id);
      if (result) {
        showRestoreSuccessMessage();
      }
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      alert('❌ เกิดข้อผิดพลาด:\n' + (err?.message || 'ไม่สามารถเรียกคืนข้อมูลได้'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle download backup
  const handleDownload = (backup: Backup) => {
    downloadBackup(backup.id, backup.fileName);
  };

  // Handle delete backup
  const handleDelete = async (backup: Backup) => {
    if (!confirm(`คุณต้องการลบไฟล์สำรอง:\n${backup.fileName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await deleteBackup(backup.id);
      if (result) {
        await refreshBackups();
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
      alert('❌ เกิดข้อผิดพลาดในการลบไฟล์สำรอง');
    } finally {
      setActionLoading(false);
    }
  };

  // Don't render if not admin
  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <BackupHeader onCreateBackup={handleCreateBackup} loading={actionLoading} />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Auto Backup Settings */}
      <BackupSettings
        settings={settings}
        loading={settingsLoading}
        onUpdate={updateSettings}
        onSave={saveSettings}
      />

      {/* Backups List */}
      <BackupList
        backups={backups}
        loading={loading}
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
