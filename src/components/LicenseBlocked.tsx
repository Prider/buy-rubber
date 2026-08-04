'use client';

import DarkModeToggle from '@/components/DarkModeToggle';

interface LicenseBlockedProps {
  message?: string | null;
  expiresAt?: Date | null;
  onEnterNewKey?: () => void;
}

export default function LicenseBlocked({
  message,
  expiresAt,
  onEnterNewKey,
}: LicenseBlockedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-950 p-4">
      <div className="max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-200/60 dark:border-red-900/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ใบอนุญาตหมดอายุ</h1>
          <DarkModeToggle />
        </div>

        <div className="px-8 py-8 space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
          </div>

          <p className="text-center text-gray-700 dark:text-gray-200 font-medium">
            {message || 'ใบอนุญาตหมดอายุแล้ว ไม่สามารถใช้งานระบบได้'}
          </p>

          {expiresAt && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              หมดอายุเมื่อ:{' '}
              {expiresAt.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-900 dark:text-amber-200 text-center">
              กรุณาติดต่อผู้ดูแลระบบเพื่อต่ออายุใบอนุญาต
            </p>
            <p className="mt-2 text-sm text-center text-amber-800 dark:text-amber-300 font-medium">
              Punsook Innotech Admin
            </p>
          </div>

          {onEnterNewKey && (
            <button
              type="button"
              onClick={onEnterNewKey}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg transition-all"
            >
              กรอก License Key ใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
