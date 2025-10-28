'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useBackup, Backup } from '@/hooks/useBackup';
import { formatFileSize } from '@/lib/utils';

export default function BackupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { loading, error, loadBackups, createBackup, restoreBackup, deleteBackup, downloadBackup } = useBackup();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Auto backup settings
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: 'daily',
    time: '22:00',
    maxCount: 30,
    autoCleanup: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const refreshBackups = async () => {
    try {
      const data = await loadBackups();
      setBackups(data || []);
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  useEffect(() => {
    refreshBackups();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/backup/settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch('/api/backup/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (result.success) {
        alert('บันทึกการตั้งค่าเรียบร้อย!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Don't render if not admin
  if (user && user.role !== 'admin') {
    return null;
  }

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
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (backup: Backup) => {
    setActionLoading(true);
    try {
      const result = await restoreBackup(backup.id);
      if (result) {
        alert('เรียกคืนข้อมูลเรียบร้อย! กรุณารีสตาร์ทแอปพลิเคชัน');
      }
    } catch (err) {
      console.error('Failed to restore backup:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (backup: Backup) => {
    downloadBackup(backup.id, backup.fileName);
  };

  const handleDelete = async (backup: Backup) => {
    setActionLoading(true);
    try {
      const result = await deleteBackup(backup.id);
      if (result) {
        await refreshBackups();
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    return type === 'auto' ? 'อัตโนมัติ' : 'ด้วยตนเอง';
  };

  const getTypeBadge = (type: string) => {
    return type === 'auto' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  };

  return (
    <Layout>
      <ProtectedRoute requiredRole="admin">
        <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                สำรองข้อมูล
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                จัดการการสำรองและเรียกคืนข้อมูล
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {actionLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>กำลังดำเนินการ...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>สำรองข้อมูลตอนนี้</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Auto Backup Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              ⚙️ ตั้งค่าการสำรองอัตโนมัติ
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Enable Auto Backup */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  เปิดใช้งานการสำรองอัตโนมัติ
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ระบบจะสำรองข้อมูลตามเวลาที่กำหนด
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enabled && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      ความถี่ในการสำรอง
                    </label>
                    <select
                      value={settings.frequency}
                      onChange={(e) => setSettings({ ...settings, frequency: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      <option value="daily">ทุกวัน</option>
                      <option value="weekly">ทุกสัปดาห์</option>
                      <option value="monthly">ทุกเดือน</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      เวลาที่จะสำรอง
                    </label>
                    <input
                      type="time"
                      value={settings.time}
                      onChange={(e) => setSettings({ ...settings, time: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>

                  {/* Max Count */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      จำนวนสูงสุดที่เก็บไว้
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxCount}
                      onChange={(e) => setSettings({ ...settings, maxCount: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ระบบจะลบไฟล์เก่าอัตโนมัติเมื่อเกินจำนวนที่กำหนด
                    </p>
                  </div>

                  {/* Auto Cleanup */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        ลบไฟล์เก่าอัตโนมัติ
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ลบไฟล์เก่าอัตโนมัติเมื่อเกินจำนวนสูงสุด
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, autoCleanup: !settings.autoCleanup })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.autoCleanup ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoCleanup ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={saveSettings}
                disabled={settingsLoading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {settingsLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>บันทึกการตั้งค่า</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Backups List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : backups.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                ยังไม่มีไฟล์สำรองข้อมูล
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                คลิกปุ่ม "สำรองข้อมูลตอนนี้" เพื่อสร้างไฟล์สำรองแรก
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ประวัติการสำรองข้อมูล ({backups.length})
              </h3>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <div key={backup.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {backup.fileName}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(backup.createdAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>{formatFileSize(backup.fileSize)}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(backup.backupType)}`}>
                          {getTypeLabel(backup.backupType)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRestore(backup)}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="เรียกคืนข้อมูล"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDownload(backup)}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="ดาวน์โหลด"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(backup)}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="ลบ"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </ProtectedRoute>
    </Layout>
  );
}

