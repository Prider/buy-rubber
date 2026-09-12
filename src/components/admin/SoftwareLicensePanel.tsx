'use client';

import { useMemo, useState } from 'react';
import { useLicense } from '@/contexts/LicenseContext';
import { useAlert } from '@/hooks/useAlert';
import type { LicenseStatus } from '@/types/license';

const SKIP_LICENSE_KEY = '__skip_license_check__';

const STATUS_LABEL: Record<LicenseStatus, string> = {
  valid: 'ใช้งานได้',
  expired: 'หมดอายุ',
  missing: 'ไม่พบใบอนุญาต',
  invalid: 'ไม่ถูกต้อง',
  renewal_required: 'ต้องต่ออายุ',
  unknown: 'กำลังตรวจสอบ',
  error: 'เกิดข้อผิดพลาด',
};

function isNeverExpires(date: Date | null): date is null {
  if (!date) return true;
  const ms = date.getTime();
  return ms === 0 || Number.isNaN(ms);
}

function formatLicenseDate(date: Date | null): string {
  if (isNeverExpires(date)) {
    return 'ไม่มีกำหนดหมดอายุ';
  }
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function daysUntil(date: Date | null): number | null {
  if (isNeverExpires(date)) return null;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function statusBadgeClass(status: LicenseStatus): string {
  if (status === 'valid') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
  if (status === 'expired' || status === 'invalid' || status === 'error') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
  if (status === 'renewal_required') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

export function SoftwareLicensePanel() {
  const { status, isLoading, licenseKey, expiresAt, renewalDate, message, updateLicense } =
    useLicense();
  const { showSuccess, showError } = useAlert();
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [saving, setSaving] = useState(false);

  const displayKey = useMemo(() => {
    if (!licenseKey || licenseKey === SKIP_LICENSE_KEY) return null;
    return licenseKey;
  }, [licenseKey]);

  const remainingDays = daysUntil(expiresAt);
  const isSkipMode = licenseKey === SKIP_LICENSE_KEY;
  const busy = isLoading || saving;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextKey = newLicenseKey.trim();
    if (!nextKey) {
      showError('กรุณากรอก License Key', 'ใส่ License Key ใหม่ก่อนอัปเดต');
      return;
    }

    setSaving(true);
    try {
      const result = await updateLicense(nextKey);
      if (result.success) {
        setNewLicenseKey('');
        showSuccess('อัปเดตใบอนุญาตสำเร็จ', result.message || 'บันทึก License Key ใหม่เรียบร้อย', {
          autoClose: true,
          autoCloseDelay: 2000,
        });
        return;
      }
      showError('อัปเดตใบอนุญาตไม่สำเร็จ', result.message || 'ใบอนุญาตไม่ถูกต้อง');
    } catch {
      showError('อัปเดตใบอนุญาตไม่สำเร็จ', 'เกิดข้อผิดพลาดในการตรวจสอบใบอนุญาต');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="admin-tabpanel-license"
      role="tabpanel"
      aria-labelledby="admin-tab-license"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            ใบอนุญาตซอฟต์แวร์
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            License Key และวันหมดอายุของระบบนี้
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
        >
          {isLoading ? 'กำลังตรวจสอบ' : STATUS_LABEL[status]}
        </span>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
            License Key ปัจจุบัน
          </p>
          {isSkipMode ? (
            <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:text-gray-200 dark:ring-gray-700">
              โหมดพัฒนา — ไม่ต้องใช้ License Key
            </p>
          ) : displayKey ? (
            <p className="break-all rounded-xl bg-gray-50 px-3.5 py-2.5 font-mono text-sm tracking-wide text-gray-900 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700">
              {displayKey}
            </p>
          ) : (
            <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:ring-gray-700">
              ยังไม่มี License Key
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:ring-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">วันหมดอายุ</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {formatLicenseDate(expiresAt)}
            </p>
            {remainingDays !== null && (
              <p
                className={`mt-1 text-xs ${
                  remainingDays < 0
                    ? 'text-red-600 dark:text-red-400'
                    : remainingDays <= 30
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {remainingDays < 0
                  ? `หมดอายุแล้ว ${Math.abs(remainingDays)} วัน`
                  : remainingDays === 0
                    ? 'หมดอายุวันนี้'
                    : `เหลืออีก ${remainingDays} วัน`}
              </p>
            )}
          </div>

          {renewalDate && !isNeverExpires(renewalDate) && (
            <div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200 dark:bg-gray-900/50 dark:ring-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                ต่ออายุออฟไลน์ภายใน
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatLicenseDate(renewalDate)}
              </p>
            </div>
          )}
        </div>

        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}

        <form onSubmit={handleUpdate} className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-700">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-new-license-key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              License Key ใหม่
            </label>
            <input
              id="admin-new-license-key"
              type="text"
              value={newLicenseKey}
              onChange={(e) => setNewLicenseKey(e.target.value)}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full rounded-xl border-0 bg-gray-50 px-3.5 py-2.5 font-mono text-sm tracking-wide text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 transition-shadow focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900/50 dark:text-gray-100 dark:ring-gray-700 dark:focus:bg-gray-900"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy || !newLicenseKey.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'กำลังอัปเดต...' : 'อัปเดต'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
