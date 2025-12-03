import React, { useMemo } from 'react';
import { Backup } from '@/hooks/useBackup';
import { PaginationControls } from '@/components/members/history/PaginationControls';
import GamerLoader from '@/components/GamerLoader';
import { BackupListItem } from './BackupListItem';

interface BackupListProps {
  backups: Backup[];
  loading: boolean;
  actionLoading: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRestore: (backup: Backup) => void;
  onDownload: (backup: Backup) => void;
  onDelete: (backup: Backup) => void;
}

export function BackupList({
  backups,
  loading,
  actionLoading,
  currentPage,
  pageSize,
  onPageChange,
  onRestore,
  onDownload,
  onDelete,
}: BackupListProps) {
  const totalPages = useMemo(() => {
    if (!backups || backups.length === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(backups.length / pageSize));
  }, [backups, pageSize]);

  const paginatedBackups = useMemo(() => {
    if (!backups || backups.length === 0) {
      return [];
    }
    const startIndex = (currentPage - 1) * pageSize;
    return backups.slice(startIndex, startIndex + pageSize);
  }, [backups, currentPage, pageSize]);

  if (loading) {
    return (
      <div className="py-12">
        <GamerLoader message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            ยังไม่มีไฟล์สำรองข้อมูล
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            คลิกปุ่ม &quot;สำรองข้อมูลตอนนี้&quot; เพื่อสร้างไฟล์สำรองแรก
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          ประวัติการสำรองข้อมูล ({backups.length})
        </h3>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {paginatedBackups.length > 0 ? (
          paginatedBackups.map((backup) => (
            <BackupListItem
              key={backup.id}
              backup={backup}
              onRestore={onRestore}
              onDownload={onDownload}
              onDelete={onDelete}
              disabled={actionLoading}
            />
          ))
        ) : (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            ยังไม่มีประวัติการสำรองข้อมูล
          </div>
        )}
      </div>

      {/* Pagination */}
      {backups.length > 0 && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => onPageChange(Math.max(1, currentPage - 1))}
            onNext={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          />
        </div>
      )}
    </div>
  );
}

