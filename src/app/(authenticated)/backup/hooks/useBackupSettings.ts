import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_BACKUP_SETTINGS } from '../constants';

export interface BackupSettings {
  enabled: boolean;
  frequency: string;
  time: string;
  maxCount: number;
  autoCleanup: boolean;
}

export function useBackupSettings() {
  const [settings, setSettings] = useState<BackupSettings>(DEFAULT_BACKUP_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/backup/settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('ไม่สามารถโหลดการตั้งค่าได้');
    }
  }, []);

  const saveSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/backup/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (result.success) {
        alert('บันทึกการตั้งค่าเรียบร้อย!');
        return true;
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      return false;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<BackupSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    saveSettings,
  };
}

