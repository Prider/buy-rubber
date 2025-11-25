import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import BackupPage from '../page';

// Mock the dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useBackup', () => ({
  useBackup: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Import after mocking
import { useAuth } from '@/contexts/AuthContext';
import { useBackup } from '@/hooks/useBackup';

describe('BackupPage - handleRestore Function', () => {
  const mockRestoreBackup = vi.fn();
  const mockLoadBackups = vi.fn();
  const mockCreateBackup = vi.fn();
  const mockDeleteBackup = vi.fn();
  const mockDownloadBackup = vi.fn();

  const mockBackupData = [
    {
      id: 'backup-test-1',
      fileName: 'backup_2024-01-01_10-00-00.db',
      filePath: '/path/to/backup.db',
      fileSize: 1024000,
      backupType: 'manual' as const,
      createdAt: '2024-01-01T10:00:00.000Z',
    },
    {
      id: 'backup-test-2',
      fileName: 'backup_2024-01-02_10-00-00.db',
      filePath: '/path/to/backup2.db',
      fileSize: 2048000,
      backupType: 'auto' as const,
      createdAt: '2024-01-02T10:00:00.000Z',
    },
  ];

  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuth to return admin user
    (useAuth as any).mockReturnValue({
      user: { 
        id: 'user-1', 
        username: 'admin', 
        role: 'admin' 
      },
    });

    // Mock useBackup to return all necessary functions
    (useBackup as any).mockReturnValue({
      loading: false,
      error: null,
      loadBackups: mockLoadBackups,
      restoreBackup: mockRestoreBackup,
      createBackup: mockCreateBackup,
      deleteBackup: mockDeleteBackup,
      downloadBackup: mockDownloadBackup,
    });

    // Mock fetch for settings
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        enabled: false,
        frequency: 'daily',
        time: '22:00',
        maxCount: 80,
        autoCleanup: true,
      }),
    });

    // Mock window.confirm to always return true (user confirms the action)
    window.confirm = vi.fn().mockReturnValue(true);
    
    // Mock window.location with a reload function
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        reload: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Default: loadBackups returns mock data
    mockLoadBackups.mockResolvedValue(mockBackupData);
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('✅ Success Scenarios', () => {
    it('should call restoreBackup when restore button is clicked', async () => {
      mockRestoreBackup.mockResolvedValue({ success: true });
      
      render(<BackupPage />);
      
      // Wait for backups to be displayed
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      // Find and click the first restore button
      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[0]);

      // Verify restoreBackup was called with correct ID
      await waitFor(() => {
        expect(mockRestoreBackup).toHaveBeenCalledWith('backup-test-1');
      });
    });

    it('should show success alert when restore succeeds', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockRestoreBackup.mockResolvedValue({ success: true });
      
      render(<BackupPage />);
      
      // Wait for buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        // The test environment is not Electron, so it should show the web browser message
        expect(alertSpy).toHaveBeenCalledWith(
          '✅ เรียกคืนข้อมูลเรียบร้อย!\n\nหน้าเว็บจะรีโหลดอัตโนมัติ...'
        );
      });

      alertSpy.mockRestore();
    });

    it('should show Electron-specific message when running in Electron', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      // Mock navigator to simulate Electron environment
      const originalUserAgent = window.navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) electron/28.0.0 Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });
      
      mockRestoreBackup.mockResolvedValue({ success: true });
      
      render(<BackupPage />);
      
      // Wait for buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        // Should show Electron-specific message
        expect(alertSpy).toHaveBeenCalledWith(
          '✅ เรียกคืนข้อมูลสำเร็จ!\n\n' +
          'กรุณาปิดแอปพลิเคชันและเปิดใหม่อีกครั้ง\n' +
          'เพื่อให้ข้อมูลที่เรียกคืนมาแสดงผลอย่างถูกต้อง\n\n' +
          '(กด Cmd+Q หรือปิดหน้าต่างแอป)'
        );
      });

      alertSpy.mockRestore();
      // Restore original userAgent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('should work with different backups', async () => {
      mockRestoreBackup.mockResolvedValue({ success: true });
      
      render(<BackupPage />);
      
      // Wait for backups to be displayed
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
      });

      // Click second restore button
      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[1]);

      await waitFor(() => {
        expect(mockRestoreBackup).toHaveBeenCalledWith('backup-test-2');
      });
    });
  });

  describe('🔄 Loading State', () => {
    it('should disable all restore buttons while action is in progress', async () => {
      // Mock a slow restore operation
      mockRestoreBackup.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 200))
      );
      
      render(<BackupPage />);
      
      // Wait for buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      
      // Click first button
      fireEvent.click(restoreButtons[0]);

      // All buttons should be disabled
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        buttons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });

      // Wait for operation to complete
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        buttons.forEach(button => {
          expect(button).not.toBeDisabled();
        });
      }, { timeout: 3000 });
    });
  });

  describe('❌ Error Handling', () => {
    it('should handle restore errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRestoreBackup.mockRejectedValue(new Error('Backup file not found'));
      
      render(<BackupPage />);
      
      // Wait for buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to restore backup:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle API errors with error messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRestoreBackup.mockRejectedValue(
        new Error('เกิดข้อผิดพลาดในการเรียกคืนข้อมูล')
      );
      
      render(<BackupPage />);
      
      // Wait for buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should not crash when restore returns null (user cancelled)', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockRestoreBackup.mockResolvedValue(null);
      
      render(<BackupPage />);
      
      // Wait for buttons to appear
      await waitFor(() => {
        const buttons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(mockRestoreBackup).toHaveBeenCalled();
      });

      // Should not show success alert if null
      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('🔐 Authorization', () => {
    it('should not render for non-admin users', () => {
      (useAuth as any).mockReturnValue({
        user: { 
          id: 'user-2', 
          username: 'regular-user', 
          role: 'user' 
        },
      });

      const { container } = render(<BackupPage />);
      
      // Should render nothing (null)
      expect(container.firstChild).toBeNull();
    });

    it('should render for admin users', async () => {
      (useAuth as any).mockReturnValue({
        user: { 
          id: 'user-1', 
          username: 'admin', 
          role: 'admin' 
        },
      });

      render(<BackupPage />);
      
      await waitFor(() => {
        // Check for the main heading (more specific)
        expect(screen.getByRole('heading', { name: /สำรองข้อมูล/i })).toBeInTheDocument();
      });
    });
  });

  describe('📊 UI State', () => {
    it('should show backup list after loading', async () => {
      render(<BackupPage />);
      
      await waitFor(() => {
        expect(screen.getByText('backup_2024-01-01_10-00-00.db')).toBeInTheDocument();
        expect(screen.getByText('backup_2024-01-02_10-00-00.db')).toBeInTheDocument();
      });
    });

    it('should display backup file information', async () => {
      render(<BackupPage />);
      
      await waitFor(() => {
        // Check that backup files are displayed with their details
        expect(screen.getByText('backup_2024-01-01_10-00-00.db')).toBeInTheDocument();
        // Check that there are action buttons (restore, download, delete)
        const restoreButtons = screen.getAllByTitle('เรียกคืนข้อมูล');
        expect(restoreButtons.length).toBe(2); // 2 backups = 2 restore buttons
      });
    });
  });
});

