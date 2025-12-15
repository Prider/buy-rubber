'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertModal, AlertType } from '@/components/common/AlertModal';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  autoClose: boolean;
  autoCloseDelay: number;
}

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void;
  showSuccess: (title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void;
  showError: (title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void;
  showWarning: (title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void;
  showInfo: (title: string, message: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    autoClose: false,
    autoCloseDelay: 5000,
  });

  const showAlert = useCallback((
    type: AlertType,
    title: string,
    message: string,
    options?: { autoClose?: boolean; autoCloseDelay?: number }
  ) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      autoClose: options?.autoClose ?? false,
      autoCloseDelay: options?.autoCloseDelay ?? 5000,
    });
  }, []);

  const showSuccess = useCallback((
    title: string,
    message: string,
    options?: { autoClose?: boolean; autoCloseDelay?: number }
  ) => {
    showAlert('success', title, message, options);
  }, [showAlert]);

  const showError = useCallback((
    title: string,
    message: string,
    options?: { autoClose?: boolean; autoCloseDelay?: number }
  ) => {
    showAlert('error', title, message, options);
  }, [showAlert]);

  const showWarning = useCallback((
    title: string,
    message: string,
    options?: { autoClose?: boolean; autoCloseDelay?: number }
  ) => {
    showAlert('warning', title, message, options);
  }, [showAlert]);

  const showInfo = useCallback((
    title: string,
    message: string,
    options?: { autoClose?: boolean; autoCloseDelay?: number }
  ) => {
    showAlert('info', title, message, options);
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const value = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
        autoClose={alertState.autoClose}
        autoCloseDelay={alertState.autoCloseDelay}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

