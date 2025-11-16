'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { createApiClient, updateApiClient } from '@/lib/apiClient';
import Layout from '@/components/Layout';
import LoginPage from '@/app/login/page';
import GamerLoader from '@/components/GamerLoader';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { config, loading, isServerMode, isClientMode } = useAppMode();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [modeSelected, setModeSelected] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Always initialize API client with current config first
      createApiClient(config);
      
      // Check if we have a saved mode configuration
      const savedMode = localStorage.getItem('app_mode');
      if (savedMode) {
        // We have a saved mode, mark as selected
        setModeSelected(true);
      } else {
        // No saved mode, show mode selection
        setModeSelected(false);
      }
    }
  }, [config, loading]);

  const handleModeSelected = () => {
    // Update API client with current config
    updateApiClient(config);
    setModeSelected(true);
  };

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
