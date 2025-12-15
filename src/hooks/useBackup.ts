import { useState, useCallback } from 'react';
import { useAlert } from '@/hooks/useAlert';
import axios from 'axios';

export interface Backup {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  backupType: 'auto' | 'manual';
  createdAt: string;
}

export const useBackup = () => {
  const { showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/backup');
      return response.data.backups;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสำรอง';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = useCallback(async (type: 'auto' | 'manual' = 'manual') => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/backup', { type });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการสำรองข้อมูล';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreBackup = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.put('/api/backup', { id });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการเรียกคืนข้อมูล';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBackup = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const confirmed = await showConfirm(
        'ยืนยันการลบไฟล์สำรอง',
        'คุณต้องการลบไฟล์สำรองนี้หรือไม่?',
        {
          confirmText: 'ลบ',
          cancelText: 'ยกเลิก',
          variant: 'danger',
        }
      );

      if (!confirmed) {
        setLoading(false);
        return null;
      }

      const response = await axios.delete(`/api/backup?id=${id}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบข้อมูล';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showConfirm]);

  const downloadBackup = useCallback((id: string) => {
    window.open(`/api/backup/${id}/download`, '_blank');
  }, []);

  return {
    loading,
    error,
    loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
  };
};

