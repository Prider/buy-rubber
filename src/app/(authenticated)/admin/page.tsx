'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAlert } from '@/hooks/useAlert';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';
import GamerLoader from '@/components/GamerLoader';
import { getApiClient } from '@/lib/apiClient';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isElectron, setIsElectron] = useState(false);
  const [electronCheckComplete, setElectronCheckComplete] = useState(false);
  const { showSuccess, showError } = useAlert();
  
  // Admin settings hook
  const {
    serverUrl,
    serverPort,
    isConnecting,
    connectionError,
    successMessage,
    copySuccess,
    localIP,
    ipLoading,
    isServerMode,
    isClientMode,
    setServerUrl,
    setServerPort,
    handleServerMode,
    handleClientMode,
    handleQuickConnect,
    copyToClipboard,
  } = useAdminSettings();

  const slipDefaults = useMemo(() => {
    return {
      companyName: 'สินทวี',
      companyAddress: '171/5 ม.8 ต.ชะมาย อ.ทุ่งสง จ.นครศรีฯ',
    };
  }, []);

  const [slipCompanyName, setSlipCompanyName] = useState(slipDefaults.companyName);
  const [slipCompanyAddress, setSlipCompanyAddress] = useState(slipDefaults.companyAddress);
  const [slipLoading, setSlipLoading] = useState(true);
  const [slipSaving, setSlipSaving] = useState(false);

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

  // Redirect if not authenticated or not in Electron
  useEffect(() => {
    // Wait for auth and Electron check to finish loading before checking
    if (isLoading || !electronCheckComplete) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isElectron) {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, router, isElectron, electronCheckComplete]);

  // Load slip settings
  useEffect(() => {
    if (!electronCheckComplete || !isElectron) return;

    const loadSlipSettings = async () => {
      try {
        setSlipLoading(true);
        const apiClient = getApiClient();
        const data = await apiClient.get<{ companyName: string; companyAddress: string }>('/api/slip/settings');

        setSlipCompanyName(data?.companyName || slipDefaults.companyName);
        setSlipCompanyAddress(data?.companyAddress || slipDefaults.companyAddress);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('slip_companyName', data?.companyName || slipDefaults.companyName);
          window.localStorage.setItem('slip_companyAddress', data?.companyAddress || slipDefaults.companyAddress);
        }
      } catch (err) {
        setSlipCompanyName(slipDefaults.companyName);
        setSlipCompanyAddress(slipDefaults.companyAddress);
        showError('โหลดข้อมูลสลิปไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setSlipLoading(false);
      }
    };

    loadSlipSettings();
  }, [electronCheckComplete, isElectron, slipDefaults.companyAddress, slipDefaults.companyName, showError]);

  const handleSaveSlipSettings = async () => {
    try {
      setSlipSaving(true);
      const apiClient = getApiClient();

      const result = await apiClient.post<{ companyName: string; companyAddress: string }>('/api/slip/settings', {
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('slip_companyName', result?.companyName || slipCompanyName);
        window.localStorage.setItem('slip_companyAddress', result?.companyAddress || slipCompanyAddress);
      }

      showSuccess('บันทึกการตั้งค่าสลิปเรียบร้อยแล้ว', 'การตั้งค่าถูกบันทึกเรียบร้อย', { autoClose: true, autoCloseDelay: 2000 });
    } catch (err) {
      showError('บันทึกการตั้งค่าสลิปไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSlipSaving(false);
    }
  };

  // Show loader while auth is loading or Electron check not complete
  if (isLoading || !electronCheckComplete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  if (!isElectron) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
          {/* Header */}
          <AdminHeader 
            title="ตั้งค่าระบบ"
            subtitle="จัดการการตั้งค่าโหมดการทำงานและผู้ใช้งาน"
          />

          <div className="w-full mx-auto">

            {/* Messages */}
            <MessageDisplay
              connectionError={connectionError}
              successMessage={successMessage}
              copySuccess={copySuccess}
            />

            {/* Mode Selection */}
            <ModeSelectionCards
              serverPort={serverPort}
              serverUrl={serverUrl}
              localIP={localIP}
              ipLoading={ipLoading}
              isConnecting={isConnecting}
              isServerMode={isServerMode}
              isClientMode={isClientMode}
              onServerPortChange={setServerPort}
              onServerUrlChange={setServerUrl}
              onServerMode={handleServerMode}
              onClientMode={() => handleClientMode()}
              onQuickConnect={handleQuickConnect}
              onCopyToClipboard={copyToClipboard}
            />
          </div>

          {/* Slip Settings */}
          <div className="w-full mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">ตั้งค่าข้อมูลใบรับซื้อ (Slip)</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    อัปเดตชื่อบริษัทและที่อยู่ที่จะแสดงบนใบรับซื้อ
                  </p>
                </div>
                {slipLoading ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    แสดงผลทันทีหลังบันทึก
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    ชื่อบริษัท
                  </label>
                  <input
                    type="text"
                    value={slipCompanyName}
                    onChange={(e) => setSlipCompanyName(e.target.value)}
                    disabled={slipSaving}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    ที่อยู่บริษัท
                  </label>
                  <textarea
                    value={slipCompanyAddress}
                    onChange={(e) => setSlipCompanyAddress(e.target.value)}
                    disabled={slipSaving}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSaveSlipSettings}
                  disabled={slipSaving}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                >
                  {slipSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </div>
          </div>

          <ProtectedRoute requiredPermission="user.read">
            <UserManagement />
          </ProtectedRoute>
      </div>
    </ProtectedRoute>
  );
}