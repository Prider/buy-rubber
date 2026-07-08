import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('/api/slip/settings', () => {
  let prisma: {
    setting: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma as unknown as typeof prisma;
    vi.mocked(prisma.setting.upsert).mockResolvedValue({});
  });

  describe('GET', () => {
    it('returns default 80mm paper size when not configured', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paperSize).toBe('80mm');
    });

    it('returns stored paper size from database', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        { key: 'slip_paperSize', value: '58mm' },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.paperSize).toBe('58mm');
    });

    it('normalizes invalid stored paper size to 80mm', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        { key: 'slip_paperSize', value: 'a4' },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.paperSize).toBe('80mm');
    });
  });

  describe('POST', () => {
    it('persists paper size setting', async () => {
      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ paperSize: '104mm' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paperSize).toBe('104mm');
      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'slip_paperSize' },
          update: { value: '104mm' },
          create: { key: 'slip_paperSize', value: '104mm' },
        })
      );
    });

    it('normalizes invalid paper size on save', async () => {
      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ paperSize: 'letter' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.paperSize).toBe('80mm');
    });

    it('keeps existing paper size when omitted from request body', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        key: 'slip_paperSize',
        value: '58mm',
      });

      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ companyName: 'Test Co' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.paperSize).toBe('58mm');
    });
  });
});
