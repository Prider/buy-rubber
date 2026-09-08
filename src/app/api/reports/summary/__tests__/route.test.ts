import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    member: {
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function req(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/reports/summary');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url.toString());
}

describe('GET /api/reports/summary', () => {
  let prisma: {
    purchase: { findMany: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn> };
    member: { findMany: ReturnType<typeof vi.fn> };
    expense: { findMany: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@/lib/prisma');
    prisma = module.prisma as typeof prisma;
  });

  it('returns 400 for an invalid report type', async () => {
    const response = await GET(req({ type: 'unknown', startDate: '2026-01-01', endDate: '2026-01-31' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when dates are missing', async () => {
    const response = await GET(req({ type: 'daily_purchase' }));
    expect(response.status).toBe(400);
  });

  it('paginates daily purchases and returns server totals without loading the full table', async () => {
    prisma.purchase.findMany.mockResolvedValue([
      {
        id: 'p1',
        date: new Date('2026-01-02'),
        purchaseNo: 'PUR-1',
        dryWeight: 10,
        totalAmount: 100,
        member: { id: 'm1', name: 'A' },
        productType: { id: 't1', name: 'Latex' },
      },
    ]);
    prisma.purchase.aggregate.mockResolvedValue({
      _count: { _all: 8559 },
      _sum: { dryWeight: 12000, totalAmount: 500000 },
    });

    const response = await GET(
      req({
        type: 'daily_purchase',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        page: '2',
        pageSize: '15',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.purchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 15,
        take: 15,
        select: expect.objectContaining({
          id: true,
          member: { select: { id: true, name: true } },
        }),
      }),
    );
    expect(body.rows).toHaveLength(1);
    expect(body.total).toBe(8559);
    expect(body.totalPages).toBe(Math.ceil(8559 / 15));
    expect(body.totals).toEqual({
      count: 8559,
      totalAmount: 500000,
      totalWeight: 12000,
    });
  });

  it('aggregates member summary in SQL instead of grouping purchase rows in Node', async () => {
    prisma.purchase.groupBy.mockResolvedValue([
      { memberId: 'm1', _count: { _all: 4 }, _sum: { dryWeight: 80, totalAmount: 400 } },
      { memberId: 'm2', _count: { _all: 1 }, _sum: { dryWeight: 10, totalAmount: 50 } },
    ]);
    prisma.purchase.aggregate.mockResolvedValue({
      _count: { _all: 5 },
      _sum: { dryWeight: 90, totalAmount: 450 },
    });
    prisma.member.findMany.mockResolvedValue([
      { id: 'm1', name: 'Somchai' },
      { id: 'm2', name: 'Suda' },
    ]);

    const response = await GET(
      req({
        type: 'member_summary',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        page: '1',
        pageSize: '15',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.purchase.findMany).not.toHaveBeenCalled();
    expect(prisma.purchase.groupBy).toHaveBeenCalled();
    expect(body.rows[0]).toEqual({
      member: { id: 'm1', name: 'Somchai' },
      count: 4,
      totalWeight: 80,
      totalAmount: 400,
    });
    expect(body.totals.count).toBe(2);
    expect(body.totals.totalAmount).toBe(450);
  });

  it('returns expense category totals independently of the paged expense rows', async () => {
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'e1',
        expenseNo: 'EXP-1',
        date: new Date('2026-01-02'),
        category: 'น้ำมัน',
        amount: 100,
        description: null,
        createdAt: new Date('2026-01-02'),
      },
    ]);
    prisma.expense.aggregate.mockResolvedValue({
      _count: { _all: 47 },
      _sum: { amount: 12000 },
    });
    prisma.expense.groupBy.mockResolvedValue([
      { category: 'น้ำมัน', _count: { _all: 20 }, _sum: { amount: 8000 } },
      { category: 'ค่าไฟ', _count: { _all: 27 }, _sum: { amount: 4000 } },
    ]);

    const response = await GET(
      req({
        type: 'expense_summary',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        page: '1',
        pageSize: '15',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rows).toHaveLength(1);
    expect(body.totals.count).toBe(47);
    expect(body.totals.totalAmount).toBe(12000);
    expect(body.categorySummary).toEqual([
      { category: 'น้ำมัน', count: 20, totalAmount: 8000 },
      { category: 'ค่าไฟ', count: 27, totalAmount: 4000 },
    ]);
  });

  it('caps export page size and flags truncation', async () => {
    prisma.purchase.findMany.mockResolvedValue([]);
    prisma.purchase.aggregate.mockResolvedValue({
      _count: { _all: 12_000 },
      _sum: { dryWeight: 1, totalAmount: 1 },
    });

    const response = await GET(
      req({
        type: 'daily_purchase',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        export: '1',
      }),
    );
    const body = await response.json();

    expect(prisma.purchase.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10_000 }));
    expect(body.truncated).toBe(true);
    expect(body.pageSize).toBe(10_000);
  });
});
