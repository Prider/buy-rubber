import { useState, useEffect, useCallback } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAlert } from '@/hooks/useAlert';
import { getLocalIPAddress, validateServerUrl, formatServerUrl } from '@/lib/config';
import { updateApiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';

export interface AdminSettingsState {
  serverUrl: string;
  serverPort: number;
  isConnecting: boolean;
  connectionError: string;
  successMessage: string;
  copySuccess: string;
  localIP: string;
  ipLoading: boolean;
  activeTab: 'settings' | 'users';
}

export interface AdminSettingsActions {
  setServerUrl: (url: string) => void;
  setServerPort: (port: number) => void;
  setIsConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
  setCopySuccess: (message: string) => void;
  setActiveTab: (tab: 'settings' | 'users') => void;
  quickSwitchMode: () => void;
  handleServerMode: () => Promise<void>;
  handleClientMode: (customServerUrl?: string, skipConnectionTest?: boolean) => Promise<void>;
  handleQuickConnect: (ip: string) => void;
  copyToClipboard: (text: string, label: string) => Promise<void>;
  resetSettings: () => void;
}

export function useAdminSettings() {
  const { config, updateConfig, isServerMode, isClientMode } = useAppMode();
  const { showConfirm } = useAlert();
  
  // State
  const [serverUrl, setServerUrl] = useState(config.serverUrl || '');
  const [serverPort, setServerPort] = useState(config.serverPort || 3001);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [localIP, setLocalIP] = useState('');
  const [ipLoading, setIpLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');

  // Load local IP on mount
  useEffect(() => {
    const fetchLocalIP = async () => {
      try {
        const ip = await getLocalIPAddress();
        setLocalIP(ip);
        logger.debug('Fetched local IP', { ip });
      } catch (error) {
        logger.error('Failed to get local IP', error);
        setLocalIP('localhost');
      } finally {
        setIpLoading(false);
      }
    };
    
    fetchLocalIP();
  }, []);

  // Handle server mode
  const handleServerMode = useCallback(async () => {
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
      logger.error('Server mode error', error);
    } finally {
      setIsConnecting(false);
    }
  }, [serverPort, updateConfig]);

  // Handle client mode
  const handleClientMode = useCallback(async (customServerUrl?: string, skipConnectionTest = false) => {
    const urlToUse = customServerUrl || serverUrl;
    
    logger.debug('handleClientMode called', { customServerUrl, serverUrl, urlToUse, skipConnectionTest });
    
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
      logger.error('Client mode error', error);
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, updateConfig]);

  // Quick switch mode
  const quickSwitchMode = useCallback(async () => {
    const currentMode = isServerMode ? 'เซิร์ฟเวอร์' : 'ไคลเอนต์';
    const targetMode = isServerMode ? 'ไคลเอนต์' : 'เซิร์ฟเวอร์';
    
    logger.debug('quickSwitchMode called', { isServerMode, serverPort, serverUrl });
    
    const confirmed = await showConfirm(
      'ยืนยันการสลับโหมด',
      `คุณต้องการสลับจากโหมด${currentMode} เป็นโหมด${targetMode} หรือไม่?`,
      {
        confirmText: 'สลับโหมด',
        cancelText: 'ยกเลิก',
        variant: 'warning',
      }
    );

    if (!confirmed) {
      return;
    }

    if (isServerMode) {
      // Switch to client mode - use localhost as default
      const defaultServerUrl = `http://localhost:${serverPort}`;
      logger.debug('Switching to client mode', { url: defaultServerUrl });
      handleClientMode(defaultServerUrl, true); // Skip connection test when switching modes
    } else {
      // Switch to server mode
      logger.debug('Switching to server mode');
      handleServerMode();
    }
  }, [isServerMode, serverPort, serverUrl, showConfirm, handleClientMode, handleServerMode]);

  // Handle quick connect
  const handleQuickConnect = useCallback((ip: string) => {
    const url = formatServerUrl(ip, serverPort);
    setServerUrl(url);
  }, [serverPort]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      // Ensure window is focused before attempting to copy
      if (typeof window !== 'undefined' && window.focus) {
        window.focus();
      }
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          setCopySuccess(`${label} คัดลอกเรียบร้อยแล้ว`);
          setTimeout(() => setCopySuccess(''), 2000);
          return;
        } catch (clipboardError: unknown) {
          // If clipboard API fails (e.g., document not focused), use fallback
          const error = clipboardError as { name?: string; message?: string };
          if (error.name === 'NotAllowedError' || error.message?.includes('not focused')) {
            logger.debug('Clipboard API failed, using fallback method', clipboardError);
            // Fall through to fallback method
          } else {
            throw clipboardError;
          }
        }
      }
      
      // Fallback method: create temporary textarea and select/copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopySuccess(`${label} คัดลอกเรียบร้อยแล้ว`);
          setTimeout(() => setCopySuccess(''), 2000);
        } else {
          throw new Error('execCommand copy failed');
        }
      } finally {
        document.body.removeChild(textarea);
      }
    } catch (error) {
      logger.error('Failed to copy to clipboard', error);
      setCopySuccess('ไม่สามารถคัดลอกได้');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  }, []);

  // Reset settings
  const resetSettings = useCallback(async () => {
    const confirmed = await showConfirm(
      'ยืนยันการรีเซ็ตการตั้งค่า',
      'คุณแน่ใจหรือไม่ที่จะรีเซ็ตการตั้งค่า?',
      {
        confirmText: 'รีเซ็ต',
        cancelText: 'ยกเลิก',
        variant: 'danger',
      }
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem('app_mode');
    localStorage.removeItem('server_url');
    localStorage.removeItem('server_port');
    localStorage.removeItem('client_port');
    window.location.reload();
  }, [showConfirm]);

  return {
    // State
    serverUrl,
    serverPort,
    isConnecting,
    connectionError,
    successMessage,
    copySuccess,
    localIP,
    ipLoading,
    activeTab,
    config,
    isServerMode,
    isClientMode,
    
    // Actions
    setServerUrl,
    setServerPort,
    setIsConnecting,
    setConnectionError,
    setSuccessMessage,
    setCopySuccess,
    setActiveTab,
    quickSwitchMode,
    handleServerMode,
    handleClientMode,
    handleQuickConnect,
    copyToClipboard,
    resetSettings,
  };
}
