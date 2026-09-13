import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';

vi.mock('@/lib/backup', () => ({
  resetToInitialData: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('POST /api/backup/reset', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('resets the database to the initial snapshot', async () => {
    const backupModule = await import('@/lib/backup');
    vi.mocked(backupModule.resetToInitialData).mockResolvedValue({
      success: true,
      message: 'รีเซ็ตข้อมูลเริ่มต้นสำเร็จ!\n\nกรุณาปิดแอปและเปิดใหม่เพื่อใช้ข้อมูลเริ่มต้น',
      requiresRestart: true,
      fileName: 'inital-data.db',
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fileName).toBe('inital-data.db');
    expect(vi.mocked(backupModule.resetToInitialData)).toHaveBeenCalled();
  });

  it('returns 500 when reset fails', async () => {
    const backupModule = await import('@/lib/backup');
    vi.mocked(backupModule.resetToInitialData).mockResolvedValue({
      success: false,
      error: 'ไม่พบไฟล์ข้อมูลเริ่มต้น (inital-data.db)',
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('ไม่พบไฟล์ข้อมูลเริ่มต้น (inital-data.db)');
  });

  it('returns 500 when reset throws', async () => {
    const backupModule = await import('@/lib/backup');
    const loggerModule = await import('@/lib/logger');
    const error = new Error('Database connection failed');
    vi.mocked(backupModule.resetToInitialData).mockRejectedValue(error);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูลเริ่มต้น');
    expect(vi.mocked(loggerModule.logger.error)).toHaveBeenCalledWith(
      'Failed to reset to initial data',
      error,
    );
  });
});
