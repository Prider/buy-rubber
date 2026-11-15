'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminPage, canSeeAdminTab, homePathForRole } from '@/types/user';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useAlert } from '@/hooks/useAlert';
import { ADMIN_TABS, AdminTabs, parseAdminTab, type AdminSettingsTab } from '@/components/admin/AdminTabs';
import { AdminTabStage } from '@/components/admin/AdminTabStage';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';
import { SlipSettingsPanel } from '@/components/admin/SlipSettingsPanel';
import { SoftwareLicensePanel } from '@/components/admin/SoftwareLicensePanel';
import { AssistantSettingsPanel } from '@/components/admin/AssistantSettingsPanel';
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
import { getThaiPhoneError } from '@/lib/memberUtils';
import { DEFAULT_SLIP_LOGO, normalizeSlipLogo, resolveSlipLogo } from '@/lib/slipLogo';

interface SavedSlipSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  logo: string;
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
    saved.companyPhone === current.companyPhone &&
    saved.logo === current.logo &&
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
  }
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const { showSuccess, showError } = useAlert();
  
  // Admin settings hook
  const {
    connectionError,
    successMessage,
    copySuccess,
    localIP,
    ipLoading,
    copyToClipboard,
  } = useAdminSettings();

  const slipDefaults = useMemo(() => {
    return {
      companyName: 'บริษัทของฉัน',
      companyAddress: 'xxxxx',
      footerText:
        'กรุณาตรวจสอบนับเงินให้ตรงกับใบเสร็จรับเงินทุกครั้งก่อนมิฉะนั้นจะไม่รับผิดชอบใดๆทั้งสิ้นขอบคุณที่ใช้บริการค่ะ',
    };
  }, []);

  const [slipCompanyName, setSlipCompanyName] = useState(slipDefaults.companyName);
  const [slipCompanyAddress, setSlipCompanyAddress] = useState(slipDefaults.companyAddress);
  const [slipCompanyPhone, setSlipCompanyPhone] = useState('');
  const [slipLogo, setSlipLogo] = useState(DEFAULT_SLIP_LOGO);
  const [slipTaxId, setSlipTaxId] = useState('');
  const [slipFooterText, setSlipFooterText] = useState(slipDefaults.footerText);
  const [slipFontSize, setSlipFontSize] = useState<SlipFontSizeId>('h2');
  const [slipPaperSize, setSlipPaperSize] = useState<SlipPaperSizeId>('80mm');
  const [slipTemplate, setSlipTemplate] = useState<SlipTemplateId>('slip');
  const [slipLoading, setSlipLoading] = useState(true);
  const [slipSaving, setSlipSaving] = useState(false);
  const [savedSlip, setSavedSlip] = useState<SavedSlipSettings | null>(null);
  const requestedTab = parseAdminTab(searchParams.get('tab'));
  const urlTab: AdminSettingsTab = requestedTab ?? 'slip';
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>(urlTab);
  const desiredTabRef = useRef<AdminSettingsTab | null>(null);
  const panelScrollerRef = useRef<HTMLDivElement>(null);
  const skipPanelScrollReset = useRef(true);
  const allowedOnAdminPage = canAccessAdminPage(user?.role);
  const visibleAdminTabs = useMemo(
    () => ADMIN_TABS.filter((tab) => canSeeAdminTab(user?.role, tab.id)),
    [user?.role],
  );
  const displayTab: AdminSettingsTab = canSeeAdminTab(user?.role, activeTab) ? activeTab : 'slip';

  const selectTab = (next: AdminSettingsTab) => {
    if (next === activeTab) return;
    desiredTabRef.current = next;
    setActiveTab(next);
  };

  useEffect(() => {
    if (requestedTab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'slip');
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [requestedTab, router, searchParams]);

  useEffect(() => {
    if (isLoading || !user || !requestedTab) return;
    if (canSeeAdminTab(user.role, requestedTab)) return;
    desiredTabRef.current = 'slip';
    setActiveTab('slip');
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'slip');
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [isLoading, requestedTab, router, searchParams, user]);

  useEffect(() => {
    const onPopState = () => {
      desiredTabRef.current = null;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (desiredTabRef.current == null) {
      setActiveTab(urlTab);
      return;
    }
    if (urlTab === desiredTabRef.current) {
      desiredTabRef.current = null;
    }
  }, [urlTab]);

  useLayoutEffect(() => {
    if (skipPanelScrollReset.current) {
      skipPanelScrollReset.current = false;
      return;
    }
    panelScrollerRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  // Redirect if not authenticated or not allowed on this page
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!allowedOnAdminPage) {
      router.replace(homePathForRole(user.role));
    }
  }, [user, isLoading, router, allowedOnAdminPage]);

  // Load slip settings
  useEffect(() => {
    if (!allowedOnAdminPage) return;

    const loadSlipSettings = async () => {
      try {
        setSlipLoading(true);
        const apiClient = getApiClient();
        const data = await apiClient.get<{
          companyName: string;
          companyAddress: string;
          companyPhone?: string;
          logo?: string;
          taxId?: string;
          footerText: string;
          fontSize?: string;
          paperSize?: string;
          template?: string;
        }>('/api/slip/settings');

        const companyName = data?.companyName || slipDefaults.companyName;
        const companyAddress = data?.companyAddress || slipDefaults.companyAddress;
        const companyPhone = (data?.companyPhone ?? '').replace(/\D/g, '').slice(0, 10);
        const logo = resolveSlipLogo(data?.logo);
        const taxId = data?.taxId?.trim() || '';
        const footerText = data?.footerText || slipDefaults.footerText;

        setSlipCompanyName(companyName);
        setSlipCompanyAddress(companyAddress);
        setSlipCompanyPhone(companyPhone);
        setSlipLogo(logo);
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
          companyPhone,
          logo,
          taxId,
          footerText,
          fontSize,
          paperSize: paper,
          template,
        });

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('slip_companyName', companyName);
          window.localStorage.setItem('slip_companyAddress', companyAddress);
          window.localStorage.setItem('slip_companyPhone', companyPhone);
          window.localStorage.setItem('slip_logo', logo);
          window.localStorage.setItem('slip_taxId', taxId);
          window.localStorage.setItem('slip_footerText', footerText);
          window.localStorage.setItem(SLIP_FONT_SIZE_STORAGE_KEY, fontSize);
          window.localStorage.setItem(SLIP_TEMPLATE_STORAGE_KEY, template);
          window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, paper);
        }
      } catch (err) {
        setSlipCompanyName(slipDefaults.companyName);
        setSlipCompanyAddress(slipDefaults.companyAddress);
        setSlipCompanyPhone('');
        setSlipLogo(DEFAULT_SLIP_LOGO);
        setSlipTaxId('');
        setSlipFooterText(slipDefaults.footerText);
        setSlipFontSize('h2');
        setSlipTemplate('slip');
        setSlipPaperSize('80mm');
        setSavedSlip({
          companyName: slipDefaults.companyName,
          companyAddress: slipDefaults.companyAddress,
          companyPhone: '',
          logo: DEFAULT_SLIP_LOGO,
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
    allowedOnAdminPage,
    slipDefaults.companyAddress,
    slipDefaults.companyName,
    slipDefaults.footerText,
  ]);

  const handleSaveSlipSettings = async () => {
    const phoneError = getThaiPhoneError(slipCompanyPhone);
    if (phoneError) {
      showError('บันทึกการตั้งค่าสลิปไม่สำเร็จ', phoneError);
      return;
    }
    const logo = normalizeSlipLogo(slipLogo);
    if (logo === null) {
      showError('บันทึกการตั้งค่าสลิปไม่สำเร็จ', 'ไฟล์โลโก้ไม่ถูกต้อง');
      return;
    }

    try {
      setSlipSaving(true);
      const apiClient = getApiClient();

      const result = await apiClient.post<{
        companyName: string;
        companyAddress: string;
        companyPhone?: string;
        logo?: string;
        taxId?: string;
        footerText: string;
        fontSize?: SlipFontSizeId;
        paperSize?: SlipPaperSizeId;
        template?: SlipTemplateId;
      }>('/api/slip/settings', {
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
        companyPhone: slipCompanyPhone,
        logo,
        taxId: slipTaxId,
        footerText: slipFooterText,
        fontSize: slipFontSize,
        paperSize: slipPaperSize,
        template: slipTemplate,
      });

      const savedPhone = result?.companyPhone ?? slipCompanyPhone;
      const savedLogo = result?.logo ?? logo;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('slip_companyName', result?.companyName || slipCompanyName);
        window.localStorage.setItem('slip_companyAddress', result?.companyAddress || slipCompanyAddress);
        window.localStorage.setItem('slip_companyPhone', savedPhone);
        window.localStorage.setItem('slip_logo', savedLogo);
        window.localStorage.setItem('slip_taxId', result?.taxId ?? slipTaxId);
        window.localStorage.setItem('slip_footerText', result?.footerText || slipFooterText);
        window.localStorage.setItem(
          SLIP_FONT_SIZE_STORAGE_KEY,
          result?.fontSize || slipFontSize,
        );
        window.localStorage.setItem(SLIP_TEMPLATE_STORAGE_KEY, result?.template || slipTemplate);
        window.localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, result?.paperSize || slipPaperSize);
      }

      setSlipCompanyPhone(savedPhone);
      setSlipLogo(savedLogo);
      setSavedSlip({
        companyName: slipCompanyName,
        companyAddress: slipCompanyAddress,
        companyPhone: savedPhone,
        logo: savedLogo,
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
      companyPhone: slipCompanyPhone,
      logo: slipLogo,
      taxId: slipTaxId,
      footerText: slipFooterText,
      fontSize: slipFontSize,
      paperSize: slipPaperSize,
      template: slipTemplate,
    });
  }, [
    slipCompanyAddress,
    slipCompanyName,
    slipCompanyPhone,
    slipFontSize,
    slipFooterText,
    slipLogo,
    slipPaperSize,
    slipTaxId,
    slipTemplate,
  ]);

  const slipDirty =
    savedSlip !== null &&
    !sameSlipSettings(savedSlip, {
      companyName: slipCompanyName,
      companyAddress: slipCompanyAddress,
      companyPhone: slipCompanyPhone,
      logo: slipLogo,
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

  if (!user || !allowedOnAdminPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังเปลี่ยนหน้า..." />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'user']}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-md:-mx-4 max-md:-mt-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-gray-100 lg:bg-white lg:shadow-sm lg:dark:border-gray-700 lg:dark:bg-gray-800">
          <header className="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900 md:border-gray-200 md:bg-transparent md:px-0 md:py-0 lg:px-5 dark:md:border-gray-700 dark:md:bg-transparent">
            <div className="flex min-w-0 flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <h1 className="hidden shrink-0 text-lg font-semibold tracking-tight sm:text-xl lg:block">
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
                  ตั้งค่าระบบ
                </span>
              </h1>
              <AdminTabs activeTab={displayTab} onSelect={selectTab} tabs={visibleAdminTabs} />
            </div>
          </header>

          <div ref={panelScrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-0 lg:px-5 lg:py-5">
            <AdminTabStage tab={displayTab}>
              {displayTab === 'slip' && (
                <SlipSettingsPanel
                  companyName={slipCompanyName}
                  companyAddress={slipCompanyAddress}
                  companyPhone={slipCompanyPhone}
                  logo={slipLogo}
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
                  onCompanyPhoneChange={setSlipCompanyPhone}
                  onLogoChange={setSlipLogo}
                  onTaxIdChange={setSlipTaxId}
                  onFooterTextChange={setSlipFooterText}
                  onFontSizeChange={handleSlipFontSizeChange}
                  onPaperSizeChange={handleSlipPaperSizeChange}
                  onTemplateChange={handleSlipTemplateChange}
                  onSave={handleSaveSlipSettings}
                />
              )}

              {displayTab === 'display' && <DisplaySettingsPanel />}

              {displayTab === 'users' && (
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
              {displayTab === 'activity' && <ActivityLogPanel />}

              {displayTab === 'connection' && (
                <div
                  id="admin-tabpanel-connection"
                  role="tabpanel"
                  aria-labelledby="admin-tab-connection"
                  className="space-y-3"
                >
                  <MessageDisplay
                    connectionError={connectionError}
                    successMessage={successMessage}
                    copySuccess={copySuccess}
                  />
                  <ModeSelectionCards
                    localIP={localIP}
                    ipLoading={ipLoading}
                    copied={copySuccess.startsWith('Server URL')}
                    onCopyToClipboard={copyToClipboard}
                  />
                </div>
              )}

              {displayTab === 'backup' && <BackupPanel />}

              {displayTab === 'license' && <SoftwareLicensePanel />}

              {displayTab === 'assistant' && <AssistantSettingsPanel />}
            </AdminTabStage>
          </div>
          </div>
      </div>
    </ProtectedRoute>
  );
}