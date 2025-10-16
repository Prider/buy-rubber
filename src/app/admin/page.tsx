'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { getLocalIPAddress, validateServerUrl, formatServerUrl } from '@/lib/config';
import { updateApiClient } from '@/lib/apiClient';
import Layout from '@/components/Layout';

export default function AdminSettingsPage() {
  const { config, updateConfig, isServerMode, isClientMode } = useAppMode();
  const [serverUrl, setServerUrl] = useState(config.serverUrl || '');
  const [serverPort, setServerPort] = useState(config.serverPort || 3001);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localIP, setLocalIP] = useState('');

  useEffect(() => {
    setLocalIP(getLocalIPAddress());
  }, []);

  const handleServerMode = async () => {
    try {
      setIsConnecting(true);
      setConnectionError('');
      setSuccessMessage('');

      // Update config to server mode
      updateConfig({
        mode: 'server',
        serverPort: serverPort,
        clientPort: 3000,
      });

      // Update API client
      updateApiClient({
        mode: 'server',
        serverPort: serverPort,
        clientPort: 3000,
      });

      setSuccessMessage('เปลี่ยนเป็นโหมดเซิร์ฟเวอร์เรียบร้อยแล้ว');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('configChanged'));
    } catch (error) {
      setConnectionError('เกิดข้อผิดพลาดในการเปลี่ยนเป็นโหมดเซิร์ฟเวอร์');
      console.error('Server mode error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClientMode = async () => {
    if (!serverUrl.trim()) {
      setConnectionError('กรุณากรอก URL เซิร์ฟเวอร์');
      return;
    }

    if (!validateServerUrl(serverUrl)) {
      setConnectionError('รูปแบบ URL เซิร์ฟเวอร์ไม่ถูกต้อง');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError('');
      setSuccessMessage('');

      // Test connection first
      const testResponse = await fetch(`${serverUrl}/api/health`);
      if (!testResponse.ok) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }

      // Update config to client mode
      updateConfig({
        mode: 'client',
        serverUrl: serverUrl,
        clientPort: 3000,
      });

      // Update API client
      updateApiClient({
        mode: 'client',
        serverUrl: serverUrl,
        clientPort: 3000,
      });

      setSuccessMessage('เปลี่ยนเป็นโหมดไคลเอนต์เรียบร้อยแล้ว');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('configChanged'));
    } catch (error) {
      setConnectionError(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ${error.message}`);
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
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ตั้งค่าระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการโหมดการทำงานของระบบ
          </p>
        </div>

        {/* Current Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            สถานะปัจจุบัน
          </h2>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isServerMode 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
            }`}>
              {isServerMode ? 'โหมดเซิร์ฟเวอร์' : 'โหมดไคลเอนต์'}
            </div>
            {isClientMode && config.serverUrl && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                เชื่อมต่อกับ: {config.serverUrl}
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {connectionError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {connectionError}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Mode Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Mode */}
          <div className="card">
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
                disabled={isConnecting || isServerMode}
                className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'กำลังเปลี่ยนโหมด...' : 
                 isServerMode ? 'โหมดเซิร์ฟเวอร์ (ใช้งานอยู่)' : 'เปลี่ยนเป็นโหมดเซิร์ฟเวอร์'}
              </button>
            </div>
          </div>

          {/* Client Mode */}
          <div className="card">
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
                disabled={isConnecting || isClientMode || !serverUrl.trim()}
                className="w-full btn btn-secondary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'กำลังเปลี่ยนโหมด...' : 
                 isClientMode ? 'โหมดไคลเอนต์ (ใช้งานอยู่)' : 'เปลี่ยนเป็นโหมดไคลเอนต์'}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            การตั้งค่าเพิ่มเติม
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  รีเซ็ตการตั้งค่า
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ลบการตั้งค่าโหมดและกลับไปสู่หน้าจอเลือกโหมด
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตการตั้งค่า?')) {
                    localStorage.removeItem('app_mode');
                    localStorage.removeItem('server_url');
                    localStorage.removeItem('server_port');
                    localStorage.removeItem('client_port');
                    window.location.reload();
                  }
                }}
                className="btn btn-danger"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
