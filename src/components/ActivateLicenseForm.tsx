'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DarkModeToggle from '@/components/DarkModeToggle';
import Logo from '@/components/Logo';
import { useLicense } from '@/contexts/LicenseContext';

interface ActivateLicenseFormProps {
  redirectTo?: string;
}

function formatExpireDate(expiresAt: Date | null): string {
  if (!expiresAt) return 'ไม่มีกำหนดหมดอายุ';
  const ms = expiresAt.getTime();
  if (ms === 0 || Number.isNaN(ms)) return 'ไม่มีกำหนดหมดอายุ';
  return expiresAt.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ActivateLicenseForm({
  redirectTo = '/login',
}: ActivateLicenseFormProps) {
  const router = useRouter();
  const {
    activateLicense,
    acknowledgeActivation,
    awaitingAcknowledgment,
    expiresAt,
    renewalDate,
    message,
  } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only show success after THIS session's successful submit — never auto-advance.
  const showSuccess = awaitingAcknowledgment;
  const busy = submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await activateLicense(licenseKey);
      if (result.success) {
        // awaitingAcknowledgment is set in context; stay here until button click.
        return;
      }
      setError(result.message || 'ใบอนุญาตไม่ถูกต้อง');
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบใบอนุญาต');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    acknowledgeActivation();
    router.replace(redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="px-8 py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Logo className="h-12 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {showSuccess ? 'เปิดใช้งานสำเร็จ' : 'เปิดใช้งานระบบ'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {showSuccess
                      ? 'ใบอนุญาตถูกต้อง พร้อมเข้าสู่ระบบ'
                      : 'กรอก License Key เพื่อใช้งาน Punsook Innotech'}
                  </p>
                </div>
              </div>
              <DarkModeToggle />
            </div>
          </div>

          <div className="px-8 py-8">
            {showSuccess ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>

                {message && (
                  <p className="text-center text-sm text-gray-700 dark:text-gray-200">{message}</p>
                )}

                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">วันหมดอายุ</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-right">
                      {formatExpireDate(expiresAt)}
                    </span>
                  </div>
                  {renewalDate && renewalDate.getTime() !== 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">ต่ออายุออฟไลน์ภายใน</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100 text-right">
                        {formatExpireDate(renewalDate)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-semibold shadow-lg"
                >
                  ไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    License Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono tracking-wide"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    required
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy || !licenseKey.trim()}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
                >
                  {busy ? 'กำลังตรวจสอบ...' : 'เปิดใช้งาน'}
                </button>
              </form>
            )}
          </div>

          {!showSuccess && (
            <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                หากยังไม่มี License Key กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
