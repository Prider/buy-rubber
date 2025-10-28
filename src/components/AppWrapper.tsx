'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { createApiClient, updateApiClient } from '@/lib/apiClient';
import Layout from '@/components/Layout';
import LoginPage from '@/app/login/page';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
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
