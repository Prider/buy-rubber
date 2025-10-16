'use client';

import { useState } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';

export default function ModeSwitcher() {
  const { config, isServerMode, isClientMode } = useAppMode();
  const [isOpen, setIsOpen] = useState(false);

  const getModeDisplay = () => {
    if (isServerMode) {
      return 'เซิร์ฟเวอร์';
    } else if (isClientMode && config.serverUrl) {
      return `ไคลเอนต์ (${config.serverUrl})`;
    }
    return 'ไม่ระบุ';
  };

  const getModeColor = () => {
    if (isServerMode) {
      return 'text-green-600 dark:text-green-400';
    } else if (isClientMode) {
      return 'text-blue-600 dark:text-blue-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="สถานะโหมดการทำงาน"
      >
        <div className={`w-2 h-2 rounded-full ${
          isServerMode ? 'bg-green-500' : isClientMode ? 'bg-blue-500' : 'bg-gray-500'
        }`}></div>
        <span className={getModeColor()}>
          {getModeDisplay()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              สถานะโหมดการทำงาน
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">โหมดปัจจุบัน:</span>
                <span className={`text-sm font-medium ${getModeColor()}`}>
                  {isServerMode ? 'เซิร์ฟเวอร์' : isClientMode ? 'ไคลเอนต์' : 'ไม่ระบุ'}
                </span>
              </div>
              
              {isClientMode && config.serverUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">เซิร์ฟเวอร์:</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {config.serverUrl}
                  </span>
                </div>
              )}
              
              {isServerMode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">พอร์ต:</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {config.serverPort || 3001}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/admin"
                className="block w-full text-center px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                จัดการการตั้งค่า
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
