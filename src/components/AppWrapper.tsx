'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { createApiClient, updateApiClient } from '@/lib/apiClient';
import ModeSelection from '@/components/ModeSelection';
import Layout from '@/components/Layout';
import LoginPage from '@/app/login/page';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { config, loading, isServerMode, isClientMode } = useAppMode();
  const [modeSelected, setModeSelected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // Listen for config changes (from admin page)
  useEffect(() => {
    const handleConfigChange = () => {
      // Re-check authentication when config changes
      checkAuthentication();
    };

    // Listen for storage changes (when admin page updates config)
    window.addEventListener('storage', handleConfigChange);
    
    // Listen for custom config change events (same tab)
    window.addEventListener('configChanged', handleConfigChange);
    
    return () => {
      window.removeEventListener('storage', handleConfigChange);
      window.removeEventListener('configChanged', handleConfigChange);
    };
  }, []);

  useEffect(() => {
    checkAuthentication();
  }, [modeSelected]);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token is still valid
        const apiClient = createApiClient(config);
        const isValid = await apiClient.healthCheck();
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleModeSelected = () => {
    // Update API client with current config
    updateApiClient(config);
    setModeSelected(true);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  // Show loading while checking configuration
  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show mode selection if not selected yet
  console.log('modeSelected', modeSelected);
  if (!modeSelected) {
    return <ModeSelection onModeSelected={handleModeSelected} />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show main application with layout
  return (
    <Layout onLogout={handleLogout}>
      {children}
    </Layout>
  );
}
