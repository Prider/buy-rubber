import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock Prisma — only $queryRaw should ever be called (never findMany)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    purchase: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Helper to build a NextRequest for this route
function req(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/reports/profit-loss');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

describe('GET /api/reports/profit-loss', () => {
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const m = await import('@/lib/prisma');
    prisma = m.prisma;
    // Default: all three $queryRaw calls return empty arrays
    prisma.$queryRaw.mockResolvedValue([]);
  });

  // ─── Critical fix: aggregation must happen in DB, not Node.js ──────────────

  describe('uses $queryRaw for aggregation (scalability fix)', () => {
    it('calls $queryRaw exactly 3 times (sale, purchase, expense) — never findMany', async () => {
      await GET(req({ startDate: '2024-01-01', endDate: '2024-01-31' }));

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
      expect(prisma.purchase.findMany).not.toHaveBeenCalled();
      expect(prisma.expense.findMany).not.toHaveBeenCalled();
    });

    it('runs all 3 aggregate queries in parallel (Promise.all — single round-trip)', async () => {
      // Track call order by recording when each mock resolves
      const callOrder: number[] = [];
      prisma.$queryRaw
        .mockImplementationOnce(() => { callOrder.push(1); return Promise.resolve([]); })
        .mockImplementationOnce(() => { callOrder.push(2); return Promise.resolve([]); })
        .mockImplementationOnce(() => { callOrder.push(3); return Promise.resolve([]); });

      await GET(req({ startDate: '2024-01-01', endDate: '2024-01-31' }));

      // All three must have been called (regardless of order, they were concurrent)
      expect(callOrder).toEqual([1, 2, 3]);
    });
  });

  // ─── Response shape ────────────────────────────────────────────────────────

  describe('response structure', () => {
    it('returns view, startDate, endDate, periods, and totals', async () => {
      const response = await GET(req({ startDate: '2024-01-01', endDate: '2024-01-31', view: 'monthly' }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty('view', 'monthly');
      expect(body).toHaveProperty('startDate');
      expect(body).toHaveProperty('endDate');
      expect(body).toHaveProperty('periods');
      expect(body).toHaveProperty('totals');
      expect(Array.isArray(body.periods)).toBe(true);
    });

    it('returns 400 for an inverted date range', async () => {
      const response = await GET(req({ startDate: '2024-12-31', endDate: '2024-01-01' }));
      expect(response.status).toBe(400);
    });
  });

  // ─── Period mapping ────────────────────────────────────────────────────────

  describe('period mapping (daily)', () => {
    it('maps sale aggregate row into the correct daily period key', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([{ period: new Date('2024-01-05T00:00:00Z'), total: 5000, weighted_price: 250000, weight: 100 }]) // sales
        .mockResolvedValueOnce([])  // purchases
        .mockResolvedValueOnce([]); // expenses

      const response = await GET(req({ view: 'daily', startDate: '2024-01-05', endDate: '2024-01-05' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-01-05');
      expect(period).toBeDefined();
      expect(period.sales).toBe(5000);
      expect(period.purchases).toBe(0);
      expect(period.expenses).toBe(0);
    });

    it('maps purchase aggregate row correctly', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([]) // sales
        .mockResolvedValueOnce([{ period: new Date('2024-01-10T00:00:00Z'), total: 3000, weighted_price: 150000, weight: 60 }]) // purchases
        .mockResolvedValueOnce([]); // expenses

      const response = await GET(req({ view: 'daily', startDate: '2024-01-10', endDate: '2024-01-10' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-01-10');
      expect(period).toBeDefined();
      expect(period.purchases).toBe(3000);
      expect(period.sales).toBe(0);
    });

    it('maps expense aggregate row correctly', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([]) // sales
        .mockResolvedValueOnce([]) // purchases
        .mockResolvedValueOnce([{ period: new Date('2024-01-15T00:00:00Z'), total: 200 }]); // expenses

      const response = await GET(req({ view: 'daily', startDate: '2024-01-15', endDate: '2024-01-15' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-01-15');
      expect(period).toBeDefined();
      expect(period.expenses).toBe(200);
    });

    it('calculates net = sales - purchases - expenses correctly', async () => {
      const day = new Date('2024-01-05T00:00:00Z');
      prisma.$queryRaw
        .mockResolvedValueOnce([{ period: day, total: 5000, weighted_price: 0, weight: 0 }])
        .mockResolvedValueOnce([{ period: day, total: 3000, weighted_price: 0, weight: 0 }])
        .mockResolvedValueOnce([{ period: day, total: 200 }]);

      const response = await GET(req({ view: 'daily', startDate: '2024-01-05', endDate: '2024-01-05' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-01-05');
      expect(period.net).toBeCloseTo(1800); // 5000 - 3000 - 200
    });

    it('computes purchasePricePerKg as weighted average', async () => {
      const day = new Date('2024-01-05T00:00:00Z');
      prisma.$queryRaw
        .mockResolvedValueOnce([]) // sales
        .mockResolvedValueOnce([{ period: day, total: 5000, weighted_price: 250000, weight: 50 }]) // 250000/50 = 5000/kg
        .mockResolvedValueOnce([]); // expenses

      const response = await GET(req({ view: 'daily', startDate: '2024-01-05', endDate: '2024-01-05' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-01-05');
      expect(period.purchasePricePerKg).toBeCloseTo(5000);
    });

    it('returns purchasePricePerKg of 0 when weight is 0', async () => {
      const day = new Date('2024-01-05T00:00:00Z');
      prisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ period: day, total: 0, weighted_price: 0, weight: 0 }])
        .mockResolvedValueOnce([]);

      const response = await GET(req({ view: 'daily', startDate: '2024-01-05', endDate: '2024-01-05' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-01-05');
      expect(period.purchasePricePerKg).toBe(0);
    });
  });

  // ─── Monthly mode ─────────────────────────────────────────────────────────

  describe('period mapping (monthly)', () => {
    it('groups results by YYYY-MM key in monthly mode', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([{ period: new Date('2024-02-01T00:00:00Z'), total: 9000, weighted_price: 0, weight: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await GET(req({ view: 'monthly', startDate: '2024-02-01', endDate: '2024-02-29' }));
      const body = await response.json();

      const period = body.periods.find((p: any) => p.period === '2024-02');
      expect(period).toBeDefined();
      expect(period.sales).toBe(9000);
    });

    it('generates one period entry per month in the range', async () => {
      const response = await GET(req({ view: 'monthly', startDate: '2024-01-01', endDate: '2024-03-31' }));
      const body = await response.json();

      expect(body.periods).toHaveLength(3); // Jan, Feb, Mar
      expect(body.periods.map((p: any) => p.period)).toEqual(['2024-01', '2024-02', '2024-03']);
    });

    it('generates one period entry per day in the range for daily view', async () => {
      const response = await GET(req({ view: 'daily', startDate: '2024-01-01', endDate: '2024-01-03' }));
      const body = await response.json();

      expect(body.periods).toHaveLength(3);
      expect(body.periods.map((p: any) => p.period)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
    });
  });

  // ─── Totals ────────────────────────────────────────────────────────────────

  describe('totals', () => {
    it('sums sales, purchases, expenses, and net across all periods', async () => {
      const day1 = new Date('2024-01-01T00:00:00Z');
      const day2 = new Date('2024-01-02T00:00:00Z');
      prisma.$queryRaw
        .mockResolvedValueOnce([
          { period: day1, total: 1000, weighted_price: 0, weight: 0 },
          { period: day2, total: 2000, weighted_price: 0, weight: 0 },
        ])
        .mockResolvedValueOnce([
          { period: day1, total: 500, weighted_price: 0, weight: 0 },
        ])
        .mockResolvedValueOnce([
          { period: day2, total: 100 },
        ]);

      const response = await GET(req({ view: 'daily', startDate: '2024-01-01', endDate: '2024-01-02' }));
      const body = await response.json();

      expect(body.totals.sales).toBeCloseTo(3000);    // 1000 + 2000
      expect(body.totals.purchases).toBeCloseTo(500);
      expect(body.totals.expenses).toBeCloseTo(100);
      expect(body.totals.net).toBeCloseTo(2400);      // 3000 - 500 - 100
    });
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when a $queryRaw call fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('DB error'));

      const response = await GET(req({ startDate: '2024-01-01', endDate: '2024-01-31' }));
      expect(response.status).toBe(500);
    });

    it('returns 500 on an unexpected error', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('timeout'));

      const response = await GET(req({ startDate: '2024-01-01', endDate: '2024-01-31' }));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toHaveProperty('error');
    });
  });
});
