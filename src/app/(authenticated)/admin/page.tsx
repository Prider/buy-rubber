'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAlert } from '@/hooks/useAlert';
import { AdminTabs, parseAdminTab, type AdminSettingsTab } from '@/components/admin/AdminTabs';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';
import { SlipSettingsPanel } from '@/components/admin/SlipSettingsPanel';
import { SoftwareLicensePanel } from '@/components/admin/SoftwareLicensePanel';
import { ActivityLogPanel } from '@/components/admin/ActivityLogPanel';
import { DisplaySettingsPanel } from '@/components/admin/DisplaySettingsPanel';
import { BackupPanel } from '@/app/(authenticated)/backup/BackupPanel';
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
import {
  SLIP_TEMPLATE_STORAGE_KEY,
  paperSizeForTemplate,
  resolveStoredSlipTemplate,
  type SlipTemplateId,
} from '@/lib/slipTemplate';

interface SavedSlipSettings {
  companyName: string;
  companyAddress: string;
  taxId: string;
  footerText: string;
  fontSize: SlipFontSizeId;
  paperSize: SlipPaperSizeId;
  template: SlipTemplateId;
}

function sameSlipSettings(saved: SavedSlipSettings, current: SavedSlipSettings) {
  return (
    saved.companyName === current.companyName &&
    saved.companyAddress === current.companyAddress &&
    saved.taxId === current.taxId &&
    saved.footerText === current.footerText &&
    saved.fontSize === current.fontSize &&
    saved.paperSize === current.paperSize &&
    saved.template === current.template
  );
}

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
  const searchParams = useSearchParams();
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
  const [slipTaxId, setSlipTaxId] = useState('');
  const [slipFooterText, setSlipFooterText] = useState(slipDefaults.footerText);
  const [slipFontSize, setSlipFontSize] = useState<SlipFontSizeId>('h2');
  const [slipPaperSize, setSlipPaperSize] = useState<SlipPaperSizeId>('80mm');
  const [slipTemplate, setSlipTemplate] = useState<SlipTemplateId>('slip');
  const [slipLoading, setSlipLoading] = useState(true);
  const [slipSaving, setSlipSaving] = useState(false);
  const [savedSlip, setSavedSlip] = useState<SavedSlipSettings | null>(null);
  const requestedTab = parseAdminTab(searchParams.get('tab'));
  const activeTab: AdminSettingsTab = requestedTab ?? 'slip';
  const canAccessAdminPage = user?.role === 'admin' || user?.role === 'root';

  useEffect(() => {
    if (requestedTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'slip');
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [requestedTab, router, searchParams]);

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
          taxId?: string;
          footerText: string;
          fontSize?: string;
          paperSize?: string;
          template?: string;
        }>('/api/slip/settings');

        const companyName = data?.companyName || slipDefaults.companyName;
        const companyAddress = data?.companyAddress || slipDefaults.companyAddress;
        const taxId = data?.taxId?.trim() || '';
        const footerText = data?.footerText || slipDefaults.footerText;

        setSlipCompanyName(companyName);
        setSlipCompanyAddress(companyAddress);
        setSlipTaxId(taxId);
        setSlipFooterText(footerText);
        const fontSize = normalizeSlipFontSize(data?.fontSize);
        const storedPaper = normalizeSlipPaperSize(data?.paperSize);
        const template = resolveStoredSlipTemplate(data?.template, storedPaper);
        const paper = paperSizeForTemplate(template, storedPaper);
        setSlipFontSize(fontSize);
        setSlipTemplate(template);
        setSlipPaperSize(paper);
        setSavedSlip({
          companyName,
          companyAddress,
          taxId,
          footerText,
          fontSize,
          paperSize: paper,
          template,
        });

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('slip_companyName', companyName);
          window.localStorage.setItem('slip_companyAddress', companyAddress);
          window.localStorage.setItem('slip_taxId', taxId);
          window.localStorage.setItem('slip_footerText', footerText);
          window.localStorage.setItem(SLIP_FONT_SIZE_STORAGE_KEY, fontSize);
          window.localStorage.setItem(SLIP_TEMPLATE_STORAGE_KEY, template);
          window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, paper);
        }
      } catch (err) {
        setSlipCompanyName(slipDefaults.companyName);
        setSlipCompanyAddress(slipDefaults.companyAddress);
        setSlipTaxId('');
        setSlipFooterText(slipDefaults.footerText);
        setSlipFontSize('h2');
        setSlipTemplate('slip');
        setSlipPaperSize('80mm');
        setSavedSlip({
          companyName: slipDefaults.companyName,
          companyAddress: slipDefaults.companyAddress,
          taxId: '',
          footerText: slipDefaults.footerText,
          fontSize: 'h2',
          paperSize: '80mm',
          template: 'slip',
        });
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
        taxId?: string;
        footerText: string;
        fontSize?: SlipFontSizeId;
        paperSize?: SlipPaperSizeId;
        template?: SlipTemplateId;
      }>('/api/slip/settings', {
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
        taxId: slipTaxId,
        footerText: slipFooterText,
        fontSize: slipFontSize,
        paperSize: slipPaperSize,
        template: slipTemplate,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('slip_companyName', result?.companyName || slipCompanyName);
        window.localStorage.setItem('slip_companyAddress', result?.companyAddress || slipCompanyAddress);
        window.localStorage.setItem('slip_taxId', result?.taxId ?? slipTaxId);
        window.localStorage.setItem('slip_footerText', result?.footerText || slipFooterText);
        window.localStorage.setItem(
          SLIP_FONT_SIZE_STORAGE_KEY,
          result?.fontSize || slipFontSize,
        );
        window.localStorage.setItem(SLIP_TEMPLATE_STORAGE_KEY, result?.template || slipTemplate);
        window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, result?.paperSize || slipPaperSize);
      }

      setSavedSlip({
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
        taxId: slipTaxId,
        footerText: slipFooterText,
        fontSize: slipFontSize,
        paperSize: slipPaperSize,
        template: slipTemplate,
      });
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
      taxId: slipTaxId,
      footerText: slipFooterText,
      fontSize: slipFontSize,
      paperSize: slipPaperSize,
      template: slipTemplate,
    });
  }, [slipCompanyAddress, slipCompanyName, slipFontSize, slipFooterText, slipPaperSize, slipTaxId, slipTemplate]);

  const slipDirty =
    savedSlip !== null &&
    !sameSlipSettings(savedSlip, {
      companyName: slipCompanyName,
      companyAddress: slipCompanyAddress,
      taxId: slipTaxId,
      footerText: slipFooterText,
      fontSize: slipFontSize,
      paperSize: slipPaperSize,
      template: slipTemplate,
    });

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

  const handleSlipTemplateChange = (id: SlipTemplateId) => {
    const nextPaper = paperSizeForTemplate(id, slipPaperSize);
    setSlipTemplate(id);
    setSlipPaperSize(nextPaper);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SLIP_TEMPLATE_STORAGE_KEY, id);
      window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, nextPaper);
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-md:-mx-4 max-md:-mt-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-gray-100 lg:bg-white lg:shadow-sm lg:dark:border-gray-700 lg:dark:bg-gray-800">
          <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900 md:border-gray-200 md:bg-transparent md:px-0 md:py-0 lg:px-5 dark:md:border-gray-700 dark:md:bg-transparent">
            <div className="flex min-w-0 flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <h1 className="hidden shrink-0 text-lg font-semibold tracking-tight sm:text-xl lg:block">
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                  ตั้งค่าระบบ
                </span>
              </h1>
              <AdminTabs activeTab={activeTab} />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-0 lg:px-5 lg:py-5">

              {activeTab === 'slip' && (
                <SlipSettingsPanel
                  companyName={slipCompanyName}
                  companyAddress={slipCompanyAddress}
                  taxId={slipTaxId}
                  footerText={slipFooterText}
                  fontSize={slipFontSize}
                  paperSize={slipPaperSize}
                  template={slipTemplate}
                  loading={slipLoading}
                  saving={slipSaving}
                  dirty={slipDirty}
                  previewHtml={slipPreviewHtml}
                  onCompanyNameChange={setSlipCompanyName}
                  onCompanyAddressChange={setSlipCompanyAddress}
                  onTaxIdChange={setSlipTaxId}
                  onFooterTextChange={setSlipFooterText}
                  onFontSizeChange={handleSlipFontSizeChange}
                  onPaperSizeChange={handleSlipPaperSizeChange}
                  onTemplateChange={handleSlipTemplateChange}
                  onSave={handleSaveSlipSettings}
                />
              )}

              {activeTab === 'display' && <DisplaySettingsPanel />}

              {activeTab === 'users' && (
                <div
                  id="admin-tabpanel-users"
                  role="tabpanel"
                  aria-labelledby="admin-tab-users"
                >
                  <ProtectedRoute
                    requiredPermission="user.read"
                    fallback={
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 sm:p-8">
                        คุณไม่มีสิทธิ์จัดการผู้ใช้งานในส่วนนี้
                      </div>
                    }
                  >
                    <UserManagement />
                  </ProtectedRoute>
                </div>
              )}
              {activeTab === 'activity' && <ActivityLogPanel />}

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

              {activeTab === 'backup' && <BackupPanel />}

              {activeTab === 'license' && <SoftwareLicensePanel />}
            </div>
          </div>
      </div>
    </ProtectedRoute>
  );
}