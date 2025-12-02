import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import fs from 'fs';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    backup: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn(),
  },
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/backup/[id]/download', () => {
  let prisma: any;

  const mockBackup = {
    id: 'backup-1',
    fileName: 'backup-2024-01-15.db',
    filePath: '/path/to/backup-2024-01-15.db',
    fileSize: 1024,
    backupType: 'manual',
    createdAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma;
  });

  describe('Successful download', () => {
    it('should download backup file', async () => {
      const mockFileBuffer = Buffer.from('test file content');
      const mockStats = { size: 1024 };

      vi.mocked(prisma.backup.findUnique).mockResolvedValue(mockBackup);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileBuffer);
      vi.mocked(fs.statSync).mockReturnValue(mockStats as fs.Stats);

      const request = new NextRequest('http://localhost:3000/api/backup/backup-1/download');
      const response = await GET(request, { params: { id: 'backup-1' } });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="backup-2024-01-15.db"');
      expect(response.headers.get('Content-Length')).toBe('1024');
      expect(vi.mocked(prisma.backup.findUnique)).toHaveBeenCalledWith({
        where: { id: 'backup-1' },
      });
      expect(vi.mocked(fs.existsSync)).toHaveBeenCalledWith(mockBackup.filePath);
      expect(vi.mocked(fs.readFileSync)).toHaveBeenCalledWith(mockBackup.filePath);
    });

    it('should return file buffer as response body', async () => {
      const mockFileBuffer = Buffer.from('test file content');
      const mockStats = { size: 1024 };

      vi.mocked(prisma.backup.findUnique).mockResolvedValue(mockBackup);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileBuffer);
      vi.mocked(fs.statSync).mockReturnValue(mockStats as fs.Stats);

      const request = new NextRequest('http://localhost:3000/api/backup/backup-1/download');
      const response = await GET(request, { params: { id: 'backup-1' } });

      const arrayBuffer = await response.arrayBuffer();
      expect(Buffer.from(arrayBuffer)).toEqual(mockFileBuffer);
    });
  });

  describe('Error handling', () => {
    it('should return 404 when backup does not exist', async () => {
      vi.mocked(prisma.backup.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/backup/nonexistent/download');
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลการสำรอง');
      expect(vi.mocked(fs.existsSync)).not.toHaveBeenCalled();
    });

    it('should return 404 when backup file does not exist', async () => {
      vi.mocked(prisma.backup.findUnique).mockResolvedValue(mockBackup);
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/backup/backup-1/download');
      const response = await GET(request, { params: { id: 'backup-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไฟล์สำรองไม่พบ');
      expect(vi.mocked(fs.readFileSync)).not.toHaveBeenCalled();
    });

    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.backup.findUnique).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/backup/backup-1/download');
      const response = await GET(request, { params: { id: 'backup-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Download backup error:', dbError);
    });

    it('should return 500 when file read fails', async () => {
      const fileError = new Error('File read failed');
      vi.mocked(prisma.backup.findUnique).mockResolvedValue(mockBackup);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw fileError;
      });

      const request = new NextRequest('http://localhost:3000/api/backup/backup-1/download');
      const response = await GET(request, { params: { id: 'backup-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Download backup error:', fileError);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string id', async () => {
      vi.mocked(prisma.backup.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/backup//download');
      const response = await GET(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลการสำรอง');
      expect(vi.mocked(prisma.backup.findUnique)).toHaveBeenCalledWith({
        where: { id: '' },
      });
    });

    it('should handle special characters in id', async () => {
      vi.mocked(prisma.backup.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/backup/special-id-123/download');
      const response = await GET(request, { params: { id: 'special-id-123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(vi.mocked(prisma.backup.findUnique)).toHaveBeenCalledWith({
        where: { id: 'special-id-123' },
      });
    });

    it('should handle UUID format id', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      const mockFileBuffer = Buffer.from('test file content');
      const mockStats = { size: 1024 };

      vi.mocked(prisma.backup.findUnique).mockResolvedValue(mockBackup);
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileBuffer);
      vi.mocked(fs.statSync).mockReturnValue(mockStats as fs.Stats);

      const request = new NextRequest(`http://localhost:3000/api/backup/${uuidId}/download`);
      const response = await GET(request, { params: { id: uuidId } });

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.backup.findUnique)).toHaveBeenCalledWith({
        where: { id: uuidId },
      });
    });
  });
});

