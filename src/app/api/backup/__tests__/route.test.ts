import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';

// Mock backup functions
vi.mock('@/lib/backup', () => ({
  createBackup: vi.fn(),
  getBackupList: vi.fn(),
  restoreBackup: vi.fn(),
  deleteBackup: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GET /api/backup', () => {
  let backupLib: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const backupModule = await import('@/lib/backup');
    const loggerModule = await import('@/lib/logger');
    backupLib = backupModule;
    logger = loggerModule.logger;
  });

  it('should return backup list', async () => {
    const mockBackups = [
      {
        id: 'backup-1',
        fileName: 'backup-2024-01-15.db',
        filePath: '/path/to/backup-2024-01-15.db',
        fileSize: 1024,
        backupType: 'manual',
        createdAt: new Date('2024-01-15'),
      },
    ];

    vi.mocked(backupLib.getBackupList).mockResolvedValue(mockBackups);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.backups).toHaveLength(1);
    expect(data.backups[0].id).toBe(mockBackups[0].id);
    expect(data.backups[0].fileName).toBe(mockBackups[0].fileName);
    expect(vi.mocked(backupLib.getBackupList)).toHaveBeenCalled();
  });

  it('should return 500 when getBackupList fails', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(backupLib.getBackupList).mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงรายการสำรองข้อมูล');
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to get backup list', error);
  });
});

describe('POST /api/backup', () => {
  let backupLib: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const backupModule = await import('@/lib/backup');
    const loggerModule = await import('@/lib/logger');
    backupLib = backupModule;
    logger = loggerModule.logger;
  });

  it('should create a manual backup', async () => {
    const mockBackup = {
      id: 'backup-1',
      fileName: 'backup-2024-01-15.db',
      filePath: '/path/to/backup-2024-01-15.db',
      fileSize: 1024,
      backupType: 'manual',
      createdAt: new Date('2024-01-15'),
    };

    vi.mocked(backupLib.createBackup).mockResolvedValue({
      success: true,
      backup: mockBackup,
      message: 'สำรองข้อมูลเรียบร้อย',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'POST',
      body: JSON.stringify({ type: 'manual' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.backup.id).toBe(mockBackup.id);
    expect(data.backup.fileName).toBe(mockBackup.fileName);
    expect(vi.mocked(backupLib.createBackup)).toHaveBeenCalledWith('manual');
  });

  it('should create an auto backup when type is auto', async () => {
    const mockBackup = {
      id: 'backup-1',
      fileName: 'backup-2024-01-15.db',
      filePath: '/path/to/backup-2024-01-15.db',
      fileSize: 1024,
      backupType: 'auto',
      createdAt: new Date('2024-01-15'),
    };

    vi.mocked(backupLib.createBackup).mockResolvedValue({
      success: true,
      backup: mockBackup,
      message: 'สำรองข้อมูลเรียบร้อย',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'POST',
      body: JSON.stringify({ type: 'auto' }),
    });

    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(backupLib.createBackup)).toHaveBeenCalledWith('auto');
  });

  it('should default to manual backup when type is not provided', async () => {
    const mockBackup = {
      id: 'backup-1',
      fileName: 'backup-2024-01-15.db',
      filePath: '/path/to/backup-2024-01-15.db',
      fileSize: 1024,
      backupType: 'manual',
      createdAt: new Date('2024-01-15'),
    };

    vi.mocked(backupLib.createBackup).mockResolvedValue({
      success: true,
      backup: mockBackup,
      message: 'สำรองข้อมูลเรียบร้อย',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(backupLib.createBackup)).toHaveBeenCalledWith('manual');
  });

  it('should handle invalid JSON body', async () => {
    const mockBackup = {
      id: 'backup-1',
      fileName: 'backup-2024-01-15.db',
      filePath: '/path/to/backup-2024-01-15.db',
      fileSize: 1024,
      backupType: 'manual',
      createdAt: new Date('2024-01-15'),
    };

    vi.mocked(backupLib.createBackup).mockResolvedValue({
      success: true,
      backup: mockBackup,
      message: 'สำรองข้อมูลเรียบร้อย',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(200);
    expect(vi.mocked(backupLib.createBackup)).toHaveBeenCalledWith('manual');
  });

  it('should return 500 when backup creation fails', async () => {
    vi.mocked(backupLib.createBackup).mockResolvedValue({
      success: false,
      error: 'Backup creation failed',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'POST',
      body: JSON.stringify({ type: 'manual' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Backup creation failed');
  });

  it('should return 500 when createBackup throws', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(backupLib.createBackup).mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'POST',
      body: JSON.stringify({ type: 'manual' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการสำรองข้อมูล');
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to create backup', error);
  });
});

describe('PUT /api/backup', () => {
  let backupLib: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const backupModule = await import('@/lib/backup');
    const loggerModule = await import('@/lib/logger');
    backupLib = backupModule;
    logger = loggerModule.logger;
  });

  it('should restore a backup', async () => {
    vi.mocked(backupLib.restoreBackup).mockResolvedValue({
      success: true,
      message: 'เรียกคืนข้อมูลเรียบร้อย',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'PUT',
      body: JSON.stringify({ id: 'backup-1' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(vi.mocked(backupLib.restoreBackup)).toHaveBeenCalledWith('backup-1');
  });

  it('should return 400 when id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('กรุณาระบุ ID ของการสำรองข้อมูล');
    expect(vi.mocked(backupLib.restoreBackup)).not.toHaveBeenCalled();
  });

  it('should return 500 when restore fails', async () => {
    vi.mocked(backupLib.restoreBackup).mockResolvedValue({
      success: false,
      error: 'Restore failed',
    });

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'PUT',
      body: JSON.stringify({ id: 'backup-1' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Restore failed');
  });

  it('should return 500 when restoreBackup throws', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(backupLib.restoreBackup).mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/backup', {
      method: 'PUT',
      body: JSON.stringify({ id: 'backup-1' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการเรียกคืนข้อมูล');
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to restore backup', error);
  });
});

describe('DELETE /api/backup', () => {
  let backupLib: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const backupModule = await import('@/lib/backup');
    const loggerModule = await import('@/lib/logger');
    backupLib = backupModule;
    logger = loggerModule.logger;
  });

  it('should delete a backup', async () => {
    vi.mocked(backupLib.deleteBackup).mockResolvedValue({
      success: true,
      message: 'ลบข้อมูลสำรองเรียบร้อย',
    });

    const request = new NextRequest('http://localhost:3000/api/backup?id=backup-1');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(vi.mocked(backupLib.deleteBackup)).toHaveBeenCalledWith('backup-1');
  });

  it('should return 400 when id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/backup');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('กรุณาระบุ ID ของการสำรองข้อมูล');
    expect(vi.mocked(backupLib.deleteBackup)).not.toHaveBeenCalled();
  });

  it('should return 500 when delete fails', async () => {
    vi.mocked(backupLib.deleteBackup).mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    const request = new NextRequest('http://localhost:3000/api/backup?id=backup-1');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Delete failed');
  });

  it('should return 500 when deleteBackup throws', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(backupLib.deleteBackup).mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/backup?id=backup-1');
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการลบข้อมูล');
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to delete backup', error);
  });
});

