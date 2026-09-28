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
      expect(data.footerText).toContain('กรุณาตรวจสอบนับเงิน');
      expect(data.fontSize).toBe('h2');
    });

    it('returns a stored font size percent', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        { key: 'slip_fontSize', value: 'h2' },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.fontSize).toBe('h2');
    });

    it('normalizes an invalid font size to 100 percent', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        { key: 'slip_fontSize', value: 'huge' },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.fontSize).toBe('h2');
    });

    it('returns stored footer text', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        { key: 'slip_footerText', value: 'ขอบคุณค่ะ' },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.footerText).toBe('ขอบคุณค่ะ');
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
      vi.mocked(prisma.setting.findUnique).mockImplementation(async (args: { where: { key: string } }) => {
        if (args.where.key === 'slip_paperSize') {
          return { key: 'slip_paperSize', value: '58mm' };
        }
        return null;
      });

      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ companyName: 'Test Co' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.paperSize).toBe('58mm');
    });

    it('persists footer text', async () => {
      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({
          footerText: '  ขอบคุณที่ใช้บริการ  ',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.footerText).toBe('ขอบคุณที่ใช้บริการ');
      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'slip_footerText' },
          update: { value: 'ขอบคุณที่ใช้บริการ' },
        })
      );
    });

    it('uses the default footer when the text is blank', async () => {
      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({
          footerText: '   ',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.footerText).toContain('กรุณาตรวจสอบนับเงิน');
    });

    it('keeps stored footer text when omitted from request body', async () => {
      vi.mocked(prisma.setting.findUnique).mockImplementation(async (args: { where: { key: string } }) => {
        if (args.where.key === 'slip_footerText') {
          return { key: 'slip_footerText', value: 'ข้อความเดิม' };
        }
        return null;
      });

      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ paperSize: '80mm' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.footerText).toBe('ข้อความเดิม');
    });

    it('persists font size', async () => {
      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ fontSize: 'h2' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fontSize).toBe('h2');
      expect(prisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'slip_fontSize' },
          update: { value: 'h2' },
        })
      );
    });

    it('keeps the stored font size when omitted from the request body', async () => {
      vi.mocked(prisma.setting.findUnique).mockImplementation(async (args: { where: { key: string } }) => {
        if (args.where.key === 'slip_fontSize') {
          return { key: 'slip_fontSize', value: 'h4' };
        }
        return null;
      });

      const request = new NextRequest('http://localhost/api/slip/settings', {
        method: 'POST',
        body: JSON.stringify({ companyName: 'Test Co' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.fontSize).toBe('h4');
    });
  });
});
