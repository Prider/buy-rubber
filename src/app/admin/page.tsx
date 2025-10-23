'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { getLocalIPAddress, validateServerUrl, formatServerUrl } from '@/lib/config';
import { updateApiClient } from '@/lib/apiClient';
import Layout from '@/components/Layout';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminSettingsPage() {
  const { config, updateConfig, isServerMode, isClientMode } = useAppMode();
  const [serverUrl, setServerUrl] = useState(config.serverUrl || '');
  const [serverPort, setServerPort] = useState(config.serverPort || 3001);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localIP, setLocalIP] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [ipLoading, setIpLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');

  const quickSwitchMode = () => {
    const currentMode = isServerMode ? 'เซิร์ฟเวอร์' : 'ไคลเอนต์';
    const targetMode = isServerMode ? 'ไคลเอนต์' : 'เซิร์ฟเวอร์';
    
    console.log('quickSwitchMode called:', { isServerMode, serverPort, serverUrl });
    
    if (confirm(`คุณต้องการสลับจากโหมด${currentMode} เป็นโหมด${targetMode} หรือไม่?`)) {
      if (isServerMode) {
        // Switch to client mode - use localhost as default
        const defaultServerUrl = `http://localhost:${serverPort}`;
        console.log('Switching to client mode with URL:', defaultServerUrl);
        handleClientMode(defaultServerUrl, true); // Skip connection test when switching modes
      } else {
        // Switch to server mode
        console.log('Switching to server mode');
        handleServerMode();
      }
    }
  };

  useEffect(() => {
    const fetchLocalIP = async () => {
      try {
        const ip = await getLocalIPAddress();
        setLocalIP(ip);
        console.log('Fetched local IP:', ip);
      } catch (error) {
        console.error('Failed to get local IP:', error);
        setLocalIP('localhost');
      } finally {
        setIpLoading(false);
      }
    };
    
    fetchLocalIP();
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

  const handleClientMode = async (customServerUrl?: string, skipConnectionTest = false) => {
    const urlToUse = customServerUrl || serverUrl;
    
    console.log('handleClientMode called with:', { customServerUrl, serverUrl, urlToUse, skipConnectionTest });
    
    if (!urlToUse.trim()) {
      setConnectionError('กรุณากรอก URL เซิร์ฟเวอร์');
      return;
    }

    if (!validateServerUrl(urlToUse)) {
      setConnectionError('รูปแบบ URL เซิร์ฟเวอร์ไม่ถูกต้อง');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError('');
      setSuccessMessage('');

      // Only test connection if not skipping (i.e., when manually entering URL)
      if (!skipConnectionTest) {
        try {
          const testResponse = await fetch(`${urlToUse}/api/health`, {
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (!testResponse.ok) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
          }
        } catch (error) {
          // Handle CORS and connection errors gracefully
          if (error instanceof TypeError && error.message.includes('CORS')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (CORS Error) - กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่และรองรับ CORS');
          }
          throw error;
        }
      }

      // Update serverUrl state if using custom URL
      if (customServerUrl) {
        setServerUrl(customServerUrl);
      }

      // Update config to client mode
      updateConfig({
        mode: 'client',
        serverUrl: urlToUse,
        clientPort: 3000,
      });

      // Update API client
      updateApiClient({
        mode: 'client',
        serverUrl: urlToUse,
        clientPort: 3000,
      });

      setSuccessMessage('เปลี่ยนเป็นโหมดไคลเอนต์เรียบร้อยแล้ว');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('configChanged'));
    } catch (error) {
      setConnectionError(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Client mode error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQuickConnect = (ip: string) => {
    const url = formatServerUrl(ip, serverPort);
    setServerUrl(url);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${label} คัดลอกเรียบร้อยแล้ว`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopySuccess('ไม่สามารถคัดลอกได้');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };
  return (
    <Layout>
      <ProtectedRoute requiredRole="admin">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
            <div className="px-8 py-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-100 dark:border-gray-600">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    ตั้งค่าระบบ
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    จัดการการตั้งค่าโหมดการทำงานและผู้ใช้งาน
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>ตั้งค่าระบบ</span>
                </div>
              </button>
              <ProtectedRoute requiredPermission="user.read">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>จัดการผู้ใช้งาน</span>
                  </div>
                </button>
              </ProtectedRoute>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      สถานะปัจจุบัน
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                        isServerMode 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-300'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isServerMode ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <span>{isServerMode ? 'โหมดเซิร์ฟเวอร์' : 'โหมดไคลเอนต์'}</span>
                        </div>
                      </div>
                      {isClientMode && config.serverUrl && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {config.serverUrl}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Switch Button */}
                    <button
                      onClick={quickSwitchMode}
                      disabled={isConnecting}
                      className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${
                        isServerMode
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isConnecting ? (
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )}
                        <span>
                          {isConnecting ? 'กำลังสลับ...' : 
                           isServerMode ? 'สลับเป็นไคลเอนต์' : 'สลับเป็นเซิร์ฟเวอร์'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {/* Error Message */}
                {connectionError && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-red-700 dark:text-red-300 font-medium">{connectionError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-200 dark:border-green-800 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-green-700 dark:text-green-300 font-medium">{successMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Copy Success Message */}
                {copySuccess && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 font-medium">{copySuccess}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
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
                        onChange={(e) => setServerPort(parseInt(e.target.value) || 3001)}
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          Server URL:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-lg">
                            {ipLoading ? 'กำลังโหลด...' : `http://${localIP}:${serverPort}`}
                          </span>
                          {!ipLoading && (
                            <button
                              onClick={() => copyToClipboard(`http://${localIP}:${serverPort}`, 'Server URL')}
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
                    </div>
                    
                    <button
                      onClick={handleServerMode}
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
                        onChange={(e) => setServerUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                        placeholder="http://192.168.1.100:3001"
                      />
                    </div>
                    
                    {/* Quick Connect Buttons */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        เชื่อมต่อด่วน
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleQuickConnect(localIP)}
                          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200 font-medium"
                          disabled={ipLoading}
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>{ipLoading ? 'กำลังโหลด...' : localIP}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleClientMode()}
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

              {/* Additional Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      การตั้งค่าเพิ่มเติม
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
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
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>รีเซ็ต</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <ProtectedRoute requiredPermission="user.read">
              <UserManagement />
            </ProtectedRoute>
          )}
        </div>
      </ProtectedRoute>
    </Layout>
  );
}
