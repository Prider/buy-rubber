'use client';

import { useState } from 'react';
import DarkModeToggle from '@/components/DarkModeToggle';
import { validateServerUrl } from '@/lib/config';

interface LicenseBlockedProps {
  title?: string;
  message?: string | null;
  expiresAt?: Date | null;
  onEnterNewKey?: () => void;
  onRetry?: () => void;
  allowServerChange?: boolean;
  serverUrl?: string;
  onServerUrlSubmit?: (url: string) => Promise<void> | void;
  onUseAsServer?: () => void;
}

export default function LicenseBlocked({
  title = 'ใบอนุญาตหมดอายุ',
  message,
  expiresAt,
  onEnterNewKey,
  onRetry,
  allowServerChange = false,
  serverUrl = '',
  onServerUrlSubmit,
  onUseAsServer,
}: LicenseBlockedProps) {
  const [nextUrl, setNextUrl] = useState(serverUrl);
  const [urlError, setUrlError] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  const handleServerUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    const url = nextUrl.trim();
    if (!validateServerUrl(url)) {
      setUrlError('รูปแบบ URL เซิร์ฟเวอร์ไม่ถูกต้อง');
      return;
    }
    setUrlError('');
    setSavingUrl(true);
    try {
      await onServerUrlSubmit?.(url);
    } finally {
      setSavingUrl(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-950 p-4">
      <div className="max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-200/60 dark:border-red-900/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
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
              Yang Dee Admin
            </p>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-3 px-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-all"
            >
              ตรวจสอบอีกครั้ง
            </button>
          )}

          {onEnterNewKey && (
            <button
              type="button"
              onClick={onEnterNewKey}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg transition-all"
            >
              กรอก License Key ใหม่
            </button>
          )}

          {allowServerChange && onServerUrlSubmit && (
            <form onSubmit={handleServerUrl} className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-5">
              <label htmlFor="blocked-server-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ที่อยู่เซิร์ฟเวอร์
              </label>
              <input
                id="blocked-server-url"
                type="url"
                value={nextUrl}
                onChange={(event) => setNextUrl(event.target.value)}
                placeholder="http://192.168.1.10:3000"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono text-sm"
              />
              {urlError && <p className="text-sm text-red-600 dark:text-red-400">{urlError}</p>}
              <button
                type="submit"
                disabled={savingUrl || !nextUrl.trim()}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold disabled:opacity-50"
              >
                {savingUrl ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อเซิร์ฟเวอร์นี้'}
              </button>
            </form>
          )}

          {onUseAsServer && (
            <button
              type="button"
              onClick={onUseAsServer}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ใช้เครื่องนี้เป็นเซิร์ฟเวอร์
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
