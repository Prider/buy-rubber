import React from 'react';

interface ModeSelectionCardsProps {
  serverPort: number;
  serverUrl: string;
  localIP: string;
  ipLoading: boolean;
  isConnecting: boolean;
  isServerMode: boolean;
  isClientMode: boolean;
  onServerPortChange: (port: number) => void;
  onServerUrlChange: (url: string) => void;
  onServerMode: () => Promise<void>;
  onClientMode: () => Promise<void>;
  onQuickConnect: (ip: string) => void;
  onCopyToClipboard: (text: string, label: string) => Promise<void>;
}

export function ModeSelectionCards({
  serverPort,
  localIP,
  ipLoading,
  onServerPortChange,
  onCopyToClipboard,
}: ModeSelectionCardsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Server Mode Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a7 7 0 01-7-7 7 7 0 017-7h14a7 7 0 017 7 7 7 0 01-7 7M5 12a7 7 0 00-7 7 7 7 0 007 7h14a7 7 0 007-7 7 7 0 00-7-7" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              โหมดเซิร์ฟเวอร์
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              รันฐานข้อมูลและ API บนเครื่องนี้
            </p>
          </div>
        </div>
      </div>
      
      {/* Server Mode Content */}
      <div className="p-4 space-y-3">
        {/* Port Input */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            พอร์ตเซิร์ฟเวอร์
          </label>
          <input
            type="number"
            value={serverPort}
            onChange={(e) => onServerPortChange(parseInt(e.target.value) || 3001)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="3001"
            min="1024"
            max="65535"
          />
        </div>
        
        {/* Network Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Server URL
              </span>
            </div>
            {!ipLoading && (
              <button
                onClick={() => onCopyToClipboard(`http://${localIP}:3000`, 'Server URL')}
                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                title="คัดลอก"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-xs font-mono text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-800 px-2 py-1.5 rounded">
            {ipLoading ? 'กำลังโหลด...' : `http://${localIP}:3000`}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
            💡 ใช้ URL นี้ในเครื่องอื่นที่ต้องการเชื่อมต่อ
          </p>
        </div>
      </div>
    </div>
  );
}
