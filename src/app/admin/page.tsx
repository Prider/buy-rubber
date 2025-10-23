'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import UserManagement from '@/components/UserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { CurrentStatusCard } from '@/components/admin/CurrentStatusCard';
import { MessageDisplay } from '@/components/admin/MessageDisplay';
import { ModeSelectionCards } from '@/components/admin/ModeSelectionCards';
import { AdditionalSettingsCard } from '@/components/admin/AdditionalSettingsCard';

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
    activeTab,
    config,
    isServerMode,
    isClientMode,
    setServerUrl,
    setServerPort,
    setActiveTab,
    quickSwitchMode,
    handleServerMode,
    handleClientMode,
    handleQuickConnect,
    copyToClipboard,
    resetSettings,
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
    <Layout>
      <ProtectedRoute requiredRole="admin">
        <div className="space-y-8">
          {/* Header */}
          <AdminHeader 
            title="ตั้งค่าระบบ"
            subtitle="จัดการการตั้งค่าโหมดการทำงานและผู้ใช้งาน"
          />

          {/* Tab Navigation */}
          <AdminTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Current Status */}
              <CurrentStatusCard
                isServerMode={isServerMode}
                isClientMode={isClientMode}
                config={config}
                isConnecting={isConnecting}
                onQuickSwitch={quickSwitchMode}
              />

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

              {/* Additional Settings */}
              <AdditionalSettingsCard
                onResetSettings={resetSettings}
              />
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