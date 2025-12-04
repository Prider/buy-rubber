'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';
import GamerLoader from '@/components/GamerLoader';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isElectron, setIsElectron] = useState(false);
  const [electronCheckComplete, setElectronCheckComplete] = useState(false);
  
  // Admin settings hook
  const {
    serverUrl,
    serverPort,
    isConnecting,
    connectionError,
    successMessage,
    copySuccess,
    localIP,
    ipLoading,
    isServerMode,
    isClientMode,
    setServerUrl,
    setServerPort,
    handleServerMode,
    handleClientMode,
    handleQuickConnect,
    copyToClipboard,
  } = useAdminSettings();

  // Check if running in Electron
  useEffect(() => {
    const checkElectron = () => {
      const isElectronEnv = typeof window !== 'undefined' && window.electron?.isElectron === true;
      setIsElectron(isElectronEnv);
      setElectronCheckComplete(true);
    };
    
    // Check immediately
    checkElectron();
    
    // Also check after a short delay in case electron object loads asynchronously
    const timeout = setTimeout(checkElectron, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  // Redirect if not authenticated or not in Electron
  useEffect(() => {
    // Wait for auth and Electron check to finish loading before checking
    if (isLoading || !electronCheckComplete) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isElectron) {
      router.push('/dashboard');
      return;
    }
  }, [user, isLoading, router, isElectron, electronCheckComplete]);

  // Show loader while auth is loading or Electron check not complete
  if (isLoading || !electronCheckComplete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  if (!isElectron) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
          {/* Header */}
          <AdminHeader 
            title="ตั้งค่าระบบ"
            subtitle="จัดการการตั้งค่าโหมดการทำงานและผู้ใช้งาน"
          />

          <div className="w-full max-w-7xl mx-auto">

            {/* Messages */}
            <MessageDisplay
              connectionError={connectionError}
              successMessage={successMessage}
              copySuccess={copySuccess}
            />

            {/* Mode Selection */}
            <ModeSelectionCards
              serverPort={serverPort}
              serverUrl={serverUrl}
              localIP={localIP}
              ipLoading={ipLoading}
              isConnecting={isConnecting}
              isServerMode={isServerMode}
              isClientMode={isClientMode}
              onServerPortChange={setServerPort}
              onServerUrlChange={setServerUrl}
              onServerMode={handleServerMode}
              onClientMode={() => handleClientMode()}
              onQuickConnect={handleQuickConnect}
              onCopyToClipboard={copyToClipboard}
            />
          </div>

          <ProtectedRoute requiredPermission="user.read">
            <UserManagement />
          </ProtectedRoute>
      </div>
    </ProtectedRoute>
  );
}