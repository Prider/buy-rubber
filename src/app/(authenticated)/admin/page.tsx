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
import { generateSlipHTMLFromItems } from '@/components/purchases/utils/slipGenerator';
import type { CartItem } from '@/components/purchases/types';
import {
  SLIP_PAPER_OPTIONS,
  SLIP_PAPER_SIZE_STORAGE_KEY,
  normalizeSlipPaperSize,
  slipPageWidthMm,
  slipPaperLabelFor,
  slipWidthPxFor,
  type SlipPaperSizeId,
} from '@/lib/slipPaper';

const SLIP_PREVIEW_ITEMS: CartItem[] = [
  {
    id: 'preview-1',
    type: 'purchase',
    date: '2026-01-01',
    memberName: 'นายตัวอย่าง ทดสอบ',
    memberCode: 'M-001',
    productTypeName: 'น้ำยางสด',
    netWeight: 125.5,
    finalPrice: 52,
    totalAmount: 6526,
  },
  {
    id: 'preview-2',
    type: 'serviceFee',
    date: '2026-01-01',
    category: 'ค่าเข้าแหล่ง',
    totalAmount: -150,
  },
];

const PREVIEW_IFRAME_HEIGHT = 560;
const FORCE_SHOW_ADMIN_ON_WEB = process.env.NEXT_PUBLIC_ADMIN_FORCE_SHOW === 'true';

type AdminSettingsTab = 'connection' | 'slip' | 'users';

const ADMIN_TABS: { id: AdminSettingsTab; label: string }[] = [
  { id: 'connection', label: 'การเชื่อมต่อ' },
  { id: 'slip', label: 'ใบรับซื้อ (Slip)' },
  { id: 'users', label: 'ผู้ใช้งาน' },
];

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
  const [slipPaperSize, setSlipPaperSize] = useState<SlipPaperSizeId>('80mm');
  const [slipLoading, setSlipLoading] = useState(true);
  const [slipSaving, setSlipSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>('connection');
  const canAccessAdminPage = isElectron || FORCE_SHOW_ADMIN_ON_WEB;

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

  // Redirect if not authenticated or not in Electron (unless force-show env is enabled)
  useEffect(() => {
    // Wait for auth and Electron check to finish loading before checking
    if (isLoading || !electronCheckComplete) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    if (!canAccessAdminPage) {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, router, canAccessAdminPage, electronCheckComplete]);

  // Load slip settings
  useEffect(() => {
    if (!electronCheckComplete || !canAccessAdminPage) return;

    const loadSlipSettings = async () => {
      try {
        setSlipLoading(true);
        const apiClient = getApiClient();
        const data = await apiClient.get<{
          companyName: string;
          companyAddress: string;
          paperSize?: string;
        }>('/api/slip/settings');

        setSlipCompanyName(data?.companyName || slipDefaults.companyName);
        setSlipCompanyAddress(data?.companyAddress || slipDefaults.companyAddress);
        const paper = normalizeSlipPaperSize(data?.paperSize);
        setSlipPaperSize(paper);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('slip_companyName', data?.companyName || slipDefaults.companyName);
          window.localStorage.setItem('slip_companyAddress', data?.companyAddress || slipDefaults.companyAddress);
          window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, paper);
        }
      } catch (err) {
        setSlipCompanyName(slipDefaults.companyName);
        setSlipCompanyAddress(slipDefaults.companyAddress);
        setSlipPaperSize('80mm');
        showError('โหลดข้อมูลสลิปไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setSlipLoading(false);
      }
    };

    loadSlipSettings();
  }, [electronCheckComplete, canAccessAdminPage, slipDefaults.companyAddress, slipDefaults.companyName, showError]);

  const handleSaveSlipSettings = async () => {
    try {
      setSlipSaving(true);
      const apiClient = getApiClient();

      const result = await apiClient.post<{
        companyName: string;
        companyAddress: string;
        paperSize?: SlipPaperSizeId;
      }>('/api/slip/settings', {
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
        paperSize: slipPaperSize,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('slip_companyName', result?.companyName || slipCompanyName);
        window.localStorage.setItem('slip_companyAddress', result?.companyAddress || slipCompanyAddress);
        window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, result?.paperSize || slipPaperSize);
      }

      showSuccess('บันทึกการตั้งค่าสลิปเรียบร้อยแล้ว', 'การตั้งค่าถูกบันทึกเรียบร้อย', { autoClose: true, autoCloseDelay: 2000 });
    } catch (err) {
      showError('บันทึกการตั้งค่าสลิปไม่สำเร็จ', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSlipSaving(false);
    }
  };

  const slipPreviewHtml = useMemo(() => {
    return generateSlipHTMLFromItems(SLIP_PREVIEW_ITEMS, {
      purchaseNo: 'PREVIEW-001',
      memberName: 'นายตัวอย่าง ทดสอบ',
      memberCode: 'M-001',
      companyName: slipCompanyName,
      companyAddress: slipCompanyAddress,
      paperSize: slipPaperSize,
    });
  }, [slipCompanyName, slipCompanyAddress, slipPaperSize]);

  const previewScale = useMemo(() => {
    const frameW = slipWidthPxFor(slipPaperSize);
    return Math.min(1, 440 / frameW);
  }, [slipPaperSize]);

  /** Matches slip document width (paper-aligned), not including extra chrome. */
  const previewFrameWidth = slipWidthPxFor(slipPaperSize);

  const handleSlipPaperSizeChange = (id: SlipPaperSizeId) => {
    setSlipPaperSize(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, id);
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
  if (!canAccessAdminPage) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
          {/* Header */}
          <AdminHeader 
            title="ตั้งค่าระบบ"
            subtitle="เลือกแท็บเพื่อจัดการการเชื่อมต่อ ใบรับซื้อ หรือผู้ใช้งาน"
          />

          <div className="w-full mx-auto">
            <div
              className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700"
              role="tablist"
              aria-label="หมวดการตั้งค่า"
            >
              {ADMIN_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`admin-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`admin-tabpanel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors duration-200 ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {activeTab === 'connection' && (
                <div
                  id="admin-tabpanel-connection"
                  role="tabpanel"
                  aria-labelledby="admin-tab-connection"
                  className="space-y-6"
                >
                  <MessageDisplay
                    connectionError={connectionError}
                    successMessage={successMessage}
                    copySuccess={copySuccess}
                  />
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
              )}

              {activeTab === 'slip' && (
                <div
                  id="admin-tabpanel-slip"
                  role="tabpanel"
                  aria-labelledby="admin-tab-slip"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">ตั้งค่าข้อมูลใบรับซื้อ (Slip)</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          อัปเดตชื่อบริษัท ที่อยู่ และขนาดกระดาษสำหรับใบรับซื้อ
                        </p>
                      </div>
                      {slipLoading ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">กำลังโหลด...</div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ตัวอย่างและขนาดกระดาษอัปเดตทันที · ชื่อ/ที่อยู่หลังบันทึก
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

                      <div className="space-y-1 lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          ขนาดกระดาษ
                        </label>
                        <select
                          value={slipPaperSize}
                          onChange={(e) => handleSlipPaperSizeChange(e.target.value as SlipPaperSizeId)}
                          disabled={slipSaving || slipLoading}
                          className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {SLIP_PAPER_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          เลือกแล้วใช้กับตัวอย่างและการพิมพ์ทันทีบนเครื่องนี้ · บันทึกเพื่อเก็บค่าถาวรบนเซิร์ฟเวอร์
                        </p>
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">ตัวอย่างใบรับซื้อ</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {slipPaperLabelFor(slipPaperSize)} · {slipPageWidthMm(slipPaperSize)} mm
                            ({slipWidthPxFor(slipPaperSize)} px)
                          </p>
                        </div>
                        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-slate-100/80 dark:bg-slate-900/50 p-4 flex justify-center overflow-auto max-h-[600px]">
                          <div
                            className="relative overflow-hidden rounded-lg shadow-sm bg-white"
                            style={{
                              width: previewFrameWidth * previewScale,
                              height: PREVIEW_IFRAME_HEIGHT * previewScale,
                            }}
                          >
                            <iframe
                              title="ตัวอย่างใบรับซื้อ"
                              srcDoc={slipPreviewHtml}
                              className="bg-white rounded-lg"
                              style={{
                                width: previewFrameWidth,
                                height: PREVIEW_IFRAME_HEIGHT,
                                border: 'none',
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                              }}
                            />
                          </div>
                        </div>
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
              )}

              {activeTab === 'users' && (
                <div
                  id="admin-tabpanel-users"
                  role="tabpanel"
                  aria-labelledby="admin-tab-users"
                >
                  <ProtectedRoute
                    requiredPermission="user.read"
                    fallback={
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-sm text-gray-600 dark:text-gray-400">
                        คุณไม่มีสิทธิ์จัดการผู้ใช้งานในส่วนนี้
                      </div>
                    }
                  >
                    <UserManagement />
                  </ProtectedRoute>
                </div>
              )}
            </div>
          </div>
      </div>
    </ProtectedRoute>
  );
}