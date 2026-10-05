import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { generateToken } from '@/lib/auth';
import { resetActivityPurgeClock } from '@/lib/activityLog';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    activityLog: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function adminRequest(path = '/api/activity'): NextRequest {
  const token = generateToken({ userId: 'admin-1', username: 'admin', role: 'admin' });
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe('GET /api/activity', () => {
  let prisma: {
    activityLog: {
      count: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    resetActivityPurgeClock();
    prisma = (await import('@/lib/prisma')).prisma as unknown as typeof prisma;
    prisma.activityLog.count.mockResolvedValue(1);
    prisma.activityLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        username: 'admin',
        action: 'delete',
        entityType: 'purchase',
        summary: 'ลบรับซื้อ PUR-1',
        createdAt: new Date().toISOString(),
      },
    ]);
    prisma.activityLog.deleteMany.mockResolvedValue({ count: 0 });
  });

  it('requires an admin', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/api/activity'));
    expect(response.status).toBe(403);
    expect(prisma.activityLog.findMany).not.toHaveBeenCalled();
  });

  it('returns the last 90 days and drops older rows', async () => {
    const response = await GET(adminRequest('/api/activity?userId=user-1&action=delete&entityType=purchase'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.retentionDays).toBe(90);
    expect(body.items).toHaveLength(1);
    expect(prisma.activityLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          action: 'delete',
          entityType: 'purchase',
          createdAt: { gte: expect.any(Date) },
        }),
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});
