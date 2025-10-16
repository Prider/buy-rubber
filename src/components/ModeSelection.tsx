'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { getLocalIPAddress, validateServerUrl, formatServerUrl } from '@/lib/config';
import { createApiClient, updateApiClient } from '@/lib/apiClient';

interface ModeSelectionProps {
  onModeSelected?: () => void;
}

export default function ModeSelection({ onModeSelected }: ModeSelectionProps) {
  const { config, switchMode, isServerMode, isClientMode } = useAppMode();
  const [serverUrl, setServerUrl] = useState(config.serverUrl || '');
  const [serverPort, setServerPort] = useState(config.serverPort || 3001);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [localIP, setLocalIP] = useState('');

  useEffect(() => {
    const fetchLocalIP = async () => {
      try {
        const ip = await getLocalIPAddress();
        setLocalIP(ip);
      } catch (error) {
        console.error('Failed to get local IP:', error);
        setLocalIP('localhost');
      }
    };
    
    fetchLocalIP();
  }, []);

  const handleServerMode = async () => {
    try {
      setIsConnecting(true);
      setConnectionError('');
      
      // Switch to server mode
      switchMode('server');
      
      // Update API client for server mode
      updateApiClient({
        mode: 'server',
        serverPort: serverPort,
        clientPort: 3000,
      });

      onModeSelected?.();
    } catch (error) {
      setConnectionError('Failed to start server mode');
      console.error('Server mode error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClientMode = async () => {
    if (!serverUrl.trim()) {
      setConnectionError('Please enter server URL');
      return;
    }

    if (!validateServerUrl(serverUrl)) {
      setConnectionError('Invalid server URL format');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError('');

      // Test connection to server
      const testClient = createApiClient({
        mode: 'client',
        serverUrl: serverUrl,
        clientPort: 3000,
      });

      const isConnected = await testClient.healthCheck();
      
      if (!isConnected) {
        throw new Error('Cannot connect to server');
      }

      // Switch to client mode
      switchMode('client', serverUrl);
      
      // Update API client for client mode
      updateApiClient({
        mode: 'client',
        serverUrl: serverUrl,
        clientPort: 3000,
      });
      
      onModeSelected?.();
    } catch (error) {
      setConnectionError(`Cannot connect to server: ${error.message}`);
      console.error('Client mode error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQuickConnect = (ip: string) => {
    const url = formatServerUrl(ip, serverPort);
    setServerUrl(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Punsook Innotech
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              เลือกโหมดการทำงาน
            </p>
          </div>

          {/* Error Message */}
          {connectionError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {connectionError}
            </div>
          )}

          {/* Mode Selection */}
          <div className="space-y-6">
            {/* Server Mode */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a7 7 0 01-7-7 7 7 0 017-7h14a7 7 0 017 7 7 7 0 01-7 7M5 12a7 7 0 00-7 7 7 7 0 007 7h14a7 7 0 007-7 7 7 0 00-7-7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    โหมดเซิร์ฟเวอร์
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    รันฐานข้อมูลและ API บนเครื่องนี้
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">พอร์ตเซิร์ฟเวอร์</label>
                  <input
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(parseInt(e.target.value) || 3001)}
                    className="input"
                    placeholder="3001"
                    min="1024"
                    max="65535"
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    ข้อมูลเครือข่าย
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    IP Address: <span className="font-mono">{localIP}</span>
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    URL: <span className="font-mono">http://{localIP}:{serverPort}</span>
                  </p>
                </div>
                
                <button
                  onClick={handleServerMode}
                  disabled={isConnecting}
                  className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'กำลังเริ่มเซิร์ฟเวอร์...' : 'เริ่มโหมดเซิร์ฟเวอร์'}
                </button>
              </div>
            </div>

            {/* Client Mode */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    โหมดไคลเอนต์
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    เชื่อมต่อกับเซิร์ฟเวอร์อื่น
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">URL เซิร์ฟเวอร์</label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="input"
                    placeholder="http://192.168.1.100:3001"
                  />
                </div>
                
                {/* Quick Connect Buttons */}
                <div>
                  <label className="label">เชื่อมต่อด่วน</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickConnect('localhost')}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      localhost
                    </button>
                    <button
                      onClick={() => handleQuickConnect(localIP)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {localIP}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleClientMode}
                  disabled={isConnecting || !serverUrl.trim()}
                  className="w-full btn btn-secondary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อเป็นไคลเอนต์'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              เลือกโหมดการทำงานที่เหมาะสมกับความต้องการของคุณ
            </p>
            <div className="text-center">
              <button
                onClick={() => {
                  localStorage.removeItem('app_mode');
                  localStorage.removeItem('server_url');
                  localStorage.removeItem('server_port');
                  localStorage.removeItem('client_port');
                  window.location.reload();
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                รีเซ็ตการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
