import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock backupScheduler
vi.mock('@/lib/backupScheduler', () => ({
  restartAutoBackup: vi.fn(),
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

describe('GET /api/backup/settings', () => {
  let prisma: { setting: { findMany: ReturnType<typeof vi.fn> } };
  let logger: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma as unknown as typeof prisma;
    logger = loggerModule.logger as unknown as typeof logger;
  });

  it('should return default settings when no settings exist', async () => {
    vi.mocked(prisma.setting.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.enabled).toBe(false);
    expect(data.frequency).toBe('daily');
    expect(data.time).toBe('22:00');
    expect(data.weeklyDay).toBe(0);
    expect(data.monthlyDay).toBe(1);
    expect(data.maxCount).toBe(30);
    expect(data.autoCleanup).toBe(true);
  });

  it('should return settings from database', async () => {
    const mockSettings = [
      { key: 'backup_enabled', value: 'true' },
      { key: 'backup_frequency', value: 'weekly' },
      { key: 'backup_time', value: '23:00' },
      { key: 'backup_weekly_day', value: '3' },
      { key: 'backup_monthly_day', value: '10' },
      { key: 'backup_max_count', value: '50' },
      { key: 'backup_auto_cleanup', value: 'false' },
    ];

    vi.mocked(prisma.setting.findMany).mockResolvedValue(mockSettings);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.enabled).toBe(true);
    expect(data.frequency).toBe('weekly');
    expect(data.time).toBe('23:00');
    expect(data.weeklyDay).toBe(3);
    expect(data.monthlyDay).toBe(10);
    expect(data.maxCount).toBe(50);
    expect(data.autoCleanup).toBe(false);
  });

  it('should handle partial settings', async () => {
    const mockSettings = [
      { key: 'backup_enabled', value: 'true' },
      { key: 'backup_frequency', value: 'monthly' },
    ];

    vi.mocked(prisma.setting.findMany).mockResolvedValue(mockSettings);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.enabled).toBe(true);
    expect(data.frequency).toBe('monthly');
    expect(data.time).toBe('22:00'); // Default
    expect(data.weeklyDay).toBe(0); // Default
    expect(data.monthlyDay).toBe(1); // Default
    expect(data.maxCount).toBe(30); // Default
    expect(data.autoCleanup).toBe(true); // Default
  });

  it('should handle invalid maxCount value', async () => {
    const mockSettings = [
      { key: 'backup_max_count', value: 'invalid' },
    ];

    vi.mocked(prisma.setting.findMany).mockResolvedValue(mockSettings);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.maxCount).toBe(30); // Should default to 30
  });

  it('should return 500 when database query fails', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(prisma.setting.findMany).mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงการตั้งค่า');
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to get backup settings', error);
  });
});

describe('POST /api/backup/settings', () => {
  let prisma: { setting: { upsert: ReturnType<typeof vi.fn> } };
  let backupScheduler: { restartAutoBackup: ReturnType<typeof vi.fn> };
  let logger: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const prismaModule = await import('@/lib/prisma');
    const backupSchedulerModule = await import('@/lib/backupScheduler');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma as unknown as typeof prisma;
    backupScheduler = backupSchedulerModule as unknown as typeof backupScheduler;
    logger = loggerModule.logger as unknown as typeof logger;
  });

  it('should save all settings', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
    vi.mocked(backupScheduler.restartAutoBackup).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        frequency: 'weekly',
        time: '23:00',
        maxCount: 50,
        autoCleanup: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('บันทึกการตั้งค่าเรียบร้อย');
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledTimes(7);
    expect(vi.mocked(backupScheduler.restartAutoBackup)).toHaveBeenCalled();
  });

  it('should use default values when settings are missing', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
    vi.mocked(backupScheduler.restartAutoBackup).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_frequency' },
        update: { value: 'daily' },
        create: { key: 'backup_frequency', value: 'daily' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_weekly_day' },
        update: { value: '0' },
        create: { key: 'backup_weekly_day', value: '0' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_monthly_day' },
        update: { value: '1' },
        create: { key: 'backup_monthly_day', value: '1' },
      })
    );
  });

  it('should convert boolean values to strings', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
    vi.mocked(backupScheduler.restartAutoBackup).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        autoCleanup: false,
      }),
    });

    await POST(request);

    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_enabled' },
        update: { value: 'true' },
        create: { key: 'backup_enabled', value: 'true' },
      })
    );

    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_auto_cleanup' },
        update: { value: 'false' },
        create: { key: 'backup_auto_cleanup', value: 'false' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_weekly_day' },
        update: { value: '0' },
        create: { key: 'backup_weekly_day', value: '0' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_monthly_day' },
        update: { value: '1' },
        create: { key: 'backup_monthly_day', value: '1' },
      })
    );
  });

  it('should convert maxCount to string', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
    vi.mocked(backupScheduler.restartAutoBackup).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        maxCount: 100,
      }),
    });

    await POST(request);

    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_max_count' },
        update: { value: '100' },
        create: { key: 'backup_max_count', value: '100' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_weekly_day' },
        update: { value: '0' },
        create: { key: 'backup_weekly_day', value: '0' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_monthly_day' },
        update: { value: '1' },
        create: { key: 'backup_monthly_day', value: '1' },
      })
    );
  });

  it('should handle null/undefined maxCount', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
    vi.mocked(backupScheduler.restartAutoBackup).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        maxCount: null,
      }),
    });

    await POST(request);

    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_max_count' },
        update: { value: '30' },
        create: { key: 'backup_max_count', value: '30' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_weekly_day' },
        update: { value: '0' },
        create: { key: 'backup_weekly_day', value: '0' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_monthly_day' },
        update: { value: '1' },
        create: { key: 'backup_monthly_day', value: '1' },
      })
    );
  });

  it('should return 500 when database update fails', async () => {
    const error = new Error('Database connection failed');
    vi.mocked(prisma.setting.upsert).mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to save backup settings', error);
  });

  it('should return 500 when restartAutoBackup fails', async () => {
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
    const error = new Error('Scheduler failed');
    vi.mocked(backupScheduler.restartAutoBackup).mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/backup/settings', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
    // Ensure weekly/monthly defaults are attempted
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_weekly_day' },
        update: { value: '0' },
        create: { key: 'backup_weekly_day', value: '0' },
      })
    );
    expect(vi.mocked(prisma.setting.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'backup_monthly_day' },
        update: { value: '1' },
        create: { key: 'backup_monthly_day', value: '1' },
      })
    );
  });
});

