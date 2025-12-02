'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
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