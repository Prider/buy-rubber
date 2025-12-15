'use client';

import React, { useEffect } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function AlertModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}: AlertModalProps) {
  // Auto-close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
      headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
      titleColor: 'text-green-900 dark:text-green-100',
    },
    error: {
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400',
      headerBg: 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
      titleColor: 'text-red-900 dark:text-red-100',
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      headerBg: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      titleColor: 'text-yellow-900 dark:text-yellow-100',
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      titleColor: 'text-blue-900 dark:text-blue-100',
    },
  };

  const styles = typeStyles[type];

  const icons = {
    success: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all border ${styles.borderColor}`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          aria-describedby="alert-message"
        >
          {/* Header */}
          <div className={`px-6 py-4 ${styles.headerBg} border-b ${styles.borderColor} rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`${styles.iconBg} rounded-full p-2 flex items-center justify-center`}>
                  <span className={styles.iconColor}>{icons[type]}</span>
                </div>
                <h3 id="alert-title" className={`text-lg font-bold ${styles.titleColor}`}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p id="alert-message" className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                type === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : type === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              ตกลง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

