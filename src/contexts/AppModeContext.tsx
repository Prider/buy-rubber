'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AppConfig, DEFAULT_SERVER_CONFIG, CONFIG_KEYS } from '@/lib/config';

interface AppModeContextType {
  config: AppConfig;
  isServerMode: boolean;
  isClientMode: boolean;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  switchMode: (mode: 'server' | 'client', serverUrl?: string) => void;
  loading: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>({
    mode: 'server',
    serverPort: DEFAULT_SERVER_CONFIG.port,
    clientPort: 3000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const savedMode = localStorage.getItem(CONFIG_KEYS.APP_MODE) || 'server';
      const savedServerUrl = localStorage.getItem(CONFIG_KEYS.SERVER_URL) || '';
      const savedServerPort = localStorage.getItem(CONFIG_KEYS.SERVER_PORT);
      const savedClientPort = localStorage.getItem(CONFIG_KEYS.CLIENT_PORT);

      const serverPort = savedServerPort ? parseInt(savedServerPort, 10) : DEFAULT_SERVER_CONFIG.port;
      const clientPort = savedClientPort ? parseInt(savedClientPort, 10) : 3000;

      setConfig({
        mode: savedMode as 'server' | 'client',
        serverUrl: savedServerUrl || undefined,
        serverPort: isNaN(serverPort) ? DEFAULT_SERVER_CONFIG.port : serverPort,
        clientPort: isNaN(clientPort) ? 3000 : clientPort,
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Save to localStorage
    try {
      if (newConfig.mode !== undefined) {
        localStorage.setItem(CONFIG_KEYS.APP_MODE, newConfig.mode);
      }
      if (newConfig.serverUrl !== undefined) {
        localStorage.setItem(CONFIG_KEYS.SERVER_URL, newConfig.serverUrl);
      }
      if (newConfig.serverPort !== undefined) {
        localStorage.setItem(CONFIG_KEYS.SERVER_PORT, newConfig.serverPort.toString());
      }
      if (newConfig.clientPort !== undefined) {
        localStorage.setItem(CONFIG_KEYS.CLIENT_PORT, newConfig.clientPort.toString());
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const switchMode = (mode: 'server' | 'client', serverUrl?: string) => {
    const newConfig: AppConfig = {
      mode,
      serverUrl: mode === 'client' ? serverUrl : undefined,
      serverPort: DEFAULT_SERVER_CONFIG.port,
      clientPort: 3000,
    };
    updateConfig(newConfig);
  };

  const isServerMode = config.mode === 'server';
  const isClientMode = config.mode === 'client';

  return (
    <AppModeContext.Provider
      value={{
        config,
        isServerMode,
        isClientMode,
        updateConfig,
        switchMode,
        loading,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}
