'use client';

import { useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { createApiClient } from '@/lib/apiClient';
import Layout from '@/components/Layout';
import LoginPage from '@/app/login/page';
import GamerLoader from '@/components/GamerLoader';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { config, loading } = useAppMode();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Always initialize API client with current config first
      createApiClient(config);
    }
  }, [config, loading]);


  // Show loading while checking configuration or authentication
  if (loading || authLoading) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <GamerLoader fullScreen message="กำลังโหลด..." />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show main application with layout
  return (
    <Layout>
      {children}
    </Layout>
  );
}
