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
  serverUrl,
  localIP,
  ipLoading,
  isConnecting,
  isServerMode,
  isClientMode,
  onServerPortChange,
  onServerUrlChange,
  onServerMode,
  onClientMode,
  onQuickConnect,
  onCopyToClipboard,
}: ModeSelectionCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Server Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a7 7 0 01-7-7 7 7 0 017-7h14a7 7 0 017 7 7 7 0 01-7 7M5 12a7 7 0 00-7 7 7 7 0 007 7h14a7 7 0 007-7 7 7 0 00-7-7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                โหมดเซิร์ฟเวอร์
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                รันฐานข้อมูลและ API บนเครื่องนี้
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              พอร์ตเซิร์ฟเวอร์
            </label>
            <input
              type="number"
              value={serverPort}
              onChange={(e) => onServerPortChange(parseInt(e.target.value) || 3001)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
              placeholder="3001"
              min="1024"
              max="65535"
            />
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                ข้อมูลเครือข่าย
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Server URL (สำหรับเครื่องอื่น):
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-lg">
                    {ipLoading ? 'กำลังโหลด...' : `http://${localIP}:3000`}
                  </span>
                  {!ipLoading && (
                    <button
                      onClick={() => onCopyToClipboard(`http://${localIP}:3000`, 'Server URL')}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-all duration-200"
                      title="คัดลอก Server URL"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 ใช้ URL นี้ในเครื่องอื่นที่ต้องการเชื่อมต่อเป็นโหมดไคลเอนต์
              </p>
            </div>
          </div>
          
          <button
            onClick={onServerMode}
            disabled={isConnecting || isServerMode}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${
              isServerMode
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isConnecting ? (
                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a7 7 0 01-7-7 7 7 0 017-7h14a7 7 0 017 7 7 7 0 01-7 7M5 12a7 7 0 00-7 7 7 7 0 007 7h14a7 7 0 007-7 7 7 0 00-7-7" />
                </svg>
              )}
              <span>
                {isConnecting ? 'กำลังเปลี่ยนโหมด...' : 
                 isServerMode ? 'โหมดเซิร์ฟเวอร์ (ใช้งานอยู่)' : 'เปลี่ยนเป็นโหมดเซิร์ฟเวอร์'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Client Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                โหมดไคลเอนต์
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                เชื่อมต่อกับเซิร์ฟเวอร์อื่น
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              URL เซิร์ฟเวอร์
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
              placeholder="http://192.168.0.179:3000"
            />
          </div>
          
          {/* Quick Connect Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              เชื่อมต่อด่วน (กรอก IP ของเครื่องเซิร์ฟเวอร์)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const url = `http://${localIP}:3000`;
                  onServerUrlChange(url);
                }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200 font-medium"
                disabled={ipLoading}
                title="ใช้ IP ของเครื่องนี้ (สำหรับทดสอบ)"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{ipLoading ? 'กำลังโหลด...' : `${localIP}:3000`}</span>
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 กรอก IP address ของเครื่องที่รันโหมดเซิร์ฟเวอร์ เช่น http://192.168.0.179:3000
            </p>
          </div>
          
          <button
            onClick={onClientMode}
            disabled={isConnecting || isClientMode || !serverUrl.trim()}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${
              isClientMode
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isConnecting ? (
                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              <span>
                {isConnecting ? 'กำลังเปลี่ยนโหมด...' : 
                 isClientMode ? 'โหมดไคลเอนต์ (ใช้งานอยู่)' : 'เปลี่ยนเป็นโหมดไคลเอนต์'}
              </span>
            </div>
          </button>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                จะทดสอบการเชื่อมต่อก่อนเปลี่ยนโหมด
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
