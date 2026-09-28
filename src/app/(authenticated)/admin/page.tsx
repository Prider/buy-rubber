'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAlert } from '@/hooks/useAlert';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabs, type AdminSettingsTab } from '@/components/admin/AdminTabs';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';
import { SlipSettingsPanel } from '@/components/admin/SlipSettingsPanel';
import { SoftwareLicensePanel } from '@/components/admin/SoftwareLicensePanel';
import GamerLoader from '@/components/GamerLoader';
import { getApiClient } from '@/lib/apiClient';
import { generateSlipHTMLFromItems } from '@/components/purchases/utils/slipGenerator';
import type { CartItem } from '@/components/purchases/types';
import {
  SLIP_FONT_SIZE_STORAGE_KEY,
  normalizeSlipFontSize,
  type SlipFontSizeId,
} from '@/lib/slipFont';
import {
  SLIP_PAPER_SIZE_STORAGE_KEY,
  normalizeSlipPaperSize,
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

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
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
      footerText:
        'กรุณาตรวจสอบนับเงินให้ตรงกับใบเสร็จรับเงินทุกครั้งก่อนมิฉะนั้นจะไม่รับผิดชอบใดๆทั้งสิ้นขอบคุณที่ใช้บริการค่ะ',
    };
  }, []);

  const [slipCompanyName, setSlipCompanyName] = useState(slipDefaults.companyName);
  const [slipCompanyAddress, setSlipCompanyAddress] = useState(slipDefaults.companyAddress);
  const [slipFooterText, setSlipFooterText] = useState(slipDefaults.footerText);
  const [slipFontSize, setSlipFontSize] = useState<SlipFontSizeId>('h2');
  const [slipPaperSize, setSlipPaperSize] = useState<SlipPaperSizeId>('80mm');
  const [slipLoading, setSlipLoading] = useState(true);
  const [slipSaving, setSlipSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>('slip');
  const canAccessAdminPage = user?.role === 'admin' || user?.role === 'root';

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!canAccessAdminPage) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router, canAccessAdminPage]);

  // Load slip settings
  useEffect(() => {
    if (!canAccessAdminPage) return;

    const loadSlipSettings = async () => {
      try {
        setSlipLoading(true);
        const apiClient = getApiClient();
        const data = await apiClient.get<{
          companyName: string;
          companyAddress: string;
          footerText: string;
          fontSize?: string;
          paperSize?: string;
        }>('/api/slip/settings');

        const companyName = data?.companyName || slipDefaults.companyName;
        const companyAddress = data?.companyAddress || slipDefaults.companyAddress;
        const footerText = data?.footerText || slipDefaults.footerText;

        setSlipCompanyName(companyName);
        setSlipCompanyAddress(companyAddress);
        setSlipFooterText(footerText);
        const fontSize = normalizeSlipFontSize(data?.fontSize);
        const paper = normalizeSlipPaperSize(data?.paperSize);
        setSlipFontSize(fontSize);
        setSlipPaperSize(paper);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('slip_companyName', companyName);
          window.localStorage.setItem('slip_companyAddress', companyAddress);
          window.localStorage.setItem('slip_footerText', footerText);
          window.localStorage.setItem(SLIP_FONT_SIZE_STORAGE_KEY, fontSize);
          window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, paper);
        }
      } catch (err) {
        setSlipCompanyName(slipDefaults.companyName);
        setSlipCompanyAddress(slipDefaults.companyAddress);
        setSlipFooterText(slipDefaults.footerText);
        setSlipFontSize('h2');
        setSlipPaperSize('80mm');
        // Slip preload is non-blocking; defaults apply until the Slip tab is opened.
        console.warn('Failed to load slip settings', err);
      } finally {
        setSlipLoading(false);
      }
    };

    loadSlipSettings();
  }, [
    canAccessAdminPage,
    slipDefaults.companyAddress,
    slipDefaults.companyName,
    slipDefaults.footerText,
  ]);

  const handleSaveSlipSettings = async () => {
    try {
      setSlipSaving(true);
      const apiClient = getApiClient();

      const result = await apiClient.post<{
        companyName: string;
        companyAddress: string;
        footerText: string;
        fontSize?: SlipFontSizeId;
        paperSize?: SlipPaperSizeId;
      }>('/api/slip/settings', {
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
        footerText: slipFooterText,
        fontSize: slipFontSize,
        paperSize: slipPaperSize,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('slip_companyName', result?.companyName || slipCompanyName);
        window.localStorage.setItem('slip_companyAddress', result?.companyAddress || slipCompanyAddress);
        window.localStorage.setItem('slip_footerText', result?.footerText || slipFooterText);
        window.localStorage.setItem(
          SLIP_FONT_SIZE_STORAGE_KEY,
          result?.fontSize || slipFontSize,
        );
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
      footerText: slipFooterText,
      fontSize: slipFontSize,
      paperSize: slipPaperSize,
    });
  }, [slipCompanyAddress, slipCompanyName, slipFontSize, slipFooterText, slipPaperSize]);

  const handleSlipFontSizeChange = (id: SlipFontSizeId) => {
    setSlipFontSize(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SLIP_FONT_SIZE_STORAGE_KEY, id);
    }
  };

  const handleSlipPaperSizeChange = (id: SlipPaperSizeId) => {
    setSlipPaperSize(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  if (!user || !canAccessAdminPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังเปลี่ยนหน้า..." />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
          {/* Header */}
          <AdminHeader 
            title="ตั้งค่าระบบ"
            subtitle="เลือกแท็บเพื่อจัดการการเชื่อมต่อ ใบรับซื้อ ผู้ใช้งาน หรือใบอนุญาตซอฟต์แวร์"
          />

          <div className="w-full mx-auto">
            <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6">

              {activeTab === 'slip' && (
                <SlipSettingsPanel
                  companyName={slipCompanyName}
                  companyAddress={slipCompanyAddress}
                  footerText={slipFooterText}
                  fontSize={slipFontSize}
                  paperSize={slipPaperSize}
                  loading={slipLoading}
                  saving={slipSaving}
                  previewHtml={slipPreviewHtml}
                  onCompanyNameChange={setSlipCompanyName}
                  onCompanyAddressChange={setSlipCompanyAddress}
                  onFooterTextChange={setSlipFooterText}
                  onFontSizeChange={handleSlipFontSizeChange}
                  onPaperSizeChange={handleSlipPaperSizeChange}
                  onSave={handleSaveSlipSettings}
                />
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
              {activeTab === 'license' && <SoftwareLicensePanel />}

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
            </div>
          </div>
      </div>
    </ProtectedRoute>
  );
}