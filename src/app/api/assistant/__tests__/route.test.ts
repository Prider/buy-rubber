import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';
import { resetAssistantRateLimit } from '@/lib/assistant/rateLimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: { aggregate: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    sale: { aggregate: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    stockPosition: { findMany: vi.fn() },
    expense: { aggregate: vi.fn(), groupBy: vi.fn() },
    serviceFee: { aggregate: vi.fn() },
    productPrice: { findMany: vi.fn() },
    productType: { findMany: vi.fn() },
    member: { count: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/sessionToken', () => ({
  getBearerToken: vi.fn(() => 'token'),
  getVerifiedUserFromToken: vi.fn(() => ({ userId: 'user-1', username: 'admin', role: 'admin' })),
}));

function request(body: unknown, token = 'token') {
  return new NextRequest('http://localhost:3000/api/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/assistant', () => {
  let prisma: {
    purchase: { aggregate: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    resetAssistantRateLimit();
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'test-model';
    delete process.env.ASSISTANT_PROXY_URL;
    vi.mocked(getBearerToken).mockReturnValue('token');
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({ userId: 'user-1', username: 'admin', role: 'admin' });
    prisma = (await import('@/lib/prisma')).prisma as unknown as typeof prisma;

    prisma.purchase.aggregate.mockResolvedValue({ _count: 0, _sum: { dryWeight: 0, totalAmount: 0 } });
    const db = (await import('@/lib/prisma')).prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    db.purchase.groupBy.mockResolvedValue([]);
    db.purchase.findMany.mockResolvedValue([]);
    db.sale.aggregate.mockResolvedValue({ _count: 0, _sum: { weight: 0, totalAmount: 0, costOfGoods: 0 } });
    db.sale.groupBy.mockResolvedValue([]);
    db.sale.findMany.mockResolvedValue([]);
    db.stockPosition.findMany.mockResolvedValue([]);
    db.expense.aggregate.mockResolvedValue({ _count: 0, _sum: { amount: 0 } });
    db.expense.groupBy.mockResolvedValue([]);
    db.serviceFee.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    db.productPrice.findMany.mockResolvedValue([]);
    db.productType.findMany.mockResolvedValue([]);
    db.member.count.mockResolvedValue(0);
    db.member.findMany.mockResolvedValue([]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: '{"text":"วันนี้รับซื้อ 0 บาท","charts":[],"tables":[]}' } }],
        }),
        text: async () => '',
      })),
    );
  });

  it('rejects an unauthenticated request before reading shop data', async () => {
    vi.mocked(getBearerToken).mockReturnValueOnce(null);

    const response = await POST(request({ query: 'กำไรเดือนนี้' }, ''));

    expect(response.status).toBe(401);
    expect(prisma.purchase.aggregate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a signed-in user who is not the owner before reading shop data', async () => {
    vi.mocked(getVerifiedUserFromToken).mockReturnValueOnce({
      userId: 'user-2',
      username: 'staff',
      role: 'viewer',
    });

    const response = await POST(request({ query: 'กำไรเดือนนี้' }));

    expect(response.status).toBe(403);
    expect(prisma.purchase.aggregate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not call the model when the question is empty', async () => {
    const response = await POST(request({ query: '   ' }));
    expect(response.status).toBe(400);
    expect(prisma.purchase.aggregate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('answers from the local snapshot and ignores client-supplied shop data', async () => {
    const response = await POST(
      request({
        query: 'กำไรเดือนนี้เท่าไหร่',
        enhancedData: { members: [{ phone: '0899999999', idCard: '1103700000000', bankAccount: '1234567890' }] },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.text).toBe('วันนี้รับซื้อ 0 บาท');
    expect(prisma.purchase.aggregate).toHaveBeenCalled();

    const outbound = JSON.stringify((fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls);
    expect(outbound).not.toContain('0899999999');
    expect(outbound).not.toContain('1103700000000');
    expect(outbound).not.toContain('1234567890');
    expect(outbound).toContain('กำไรเดือนนี้เท่าไหร่');
  });

  it('hides upstream auth failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        text: async () => 'invalid secret-upstream',
        json: async () => ({}),
      })),
    );

    const response = await POST(request({ query: 'สต็อกเหลือเท่าไหร่' }));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('คีย์ผู้ช่วยอัจฉริยะใช้ไม่ได้');
    expect(JSON.stringify(data)).not.toContain('secret-upstream');
  });

  it('stops after the user rate limit', async () => {
    for (let index = 0; index < 20; index += 1) {
      const response = await POST(request({ query: `คำถาม ${index}` }));
      expect(response.status).toBe(200);
    }

    const limited = await POST(request({ query: 'คำถามเกิน' }));
    expect(limited.status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(20);
  });
});
