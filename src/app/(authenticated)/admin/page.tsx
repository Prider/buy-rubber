'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/platform/ui/UserManagement';
import ProtectedRoute from '@/platform/ui/ProtectedRoute';
import { useAuth } from '@/platform/AuthContext';
import { useAlert } from '@/shared/hooks/useAlert';
import { AdminHeader } from '@/industries/rubber/ui/admin/AdminHeader';
import { AdminTabs, type AdminSettingsTab } from '@/industries/rubber/ui/admin/AdminTabs';
import { SlipSettingsPanel } from '@/industries/rubber/ui/admin/SlipSettingsPanel';
import GamerLoader from '@/shared/ui/GamerLoader';
import { getApiClient } from '@/shared/apiClient';
import { generateSlipHTMLFromItems } from '@/industries/rubber/ui/purchases/utils/slipGenerator';
import type { CartItem } from '@/industries/rubber/ui/purchases/types';
import {
  SLIP_PAPER_SIZE_STORAGE_KEY,
  normalizeSlipPaperSize,
  type SlipPaperSizeId,
} from '@/shared/slipPaper';

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
        // Slip preload is non-blocking; defaults apply until the Slip tab is opened.
        console.warn('Failed to load slip settings', err);
      } finally {
        setSlipLoading(false);
      }
    };

    loadSlipSettings();
  }, [canAccessAdminPage, slipDefaults.companyAddress, slipDefaults.companyName]);

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
            subtitle="เลือกแท็บเพื่อจัดการใบรับซื้อ หรือผู้ใช้งาน"
          />

          <div className="w-full mx-auto">
            <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6">

              {activeTab === 'slip' && (
                <SlipSettingsPanel
                  companyName={slipCompanyName}
                  companyAddress={slipCompanyAddress}
                  paperSize={slipPaperSize}
                  loading={slipLoading}
                  saving={slipSaving}
                  previewHtml={slipPreviewHtml}
                  onCompanyNameChange={setSlipCompanyName}
                  onCompanyAddressChange={setSlipCompanyAddress}
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
            </div>
          </div>
      </div>
    </ProtectedRoute>
  );
}