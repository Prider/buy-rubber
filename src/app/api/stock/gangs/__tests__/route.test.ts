import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { gangOverlapsRange, parseGangDateRange } from '../dateRange';
import {
  DATE_FILTER_GANG_FIXTURES,
  fixtureGangNos,
  salesForGangs,
  toApiGangRecord,
} from './dateFilterFixtures';

const gangFindMany = vi.fn();
const gangCount = vi.fn();
const saleFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sale: {
      findMany: (...args: unknown[]) => saleFindMany(...args),
    },
  },
}));

vi.mock('@/lib/prismaStock', () => ({
  stockGang: {
    findMany: (...args: unknown[]) => gangFindMany(...args),
    count: (...args: unknown[]) => gangCount(...args),
  },
}));

function dt(isoDate: string) {
  return new Date(isoDate);
}

describe('GET /api/stock/gangs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gangFindMany.mockResolvedValue([]);
    gangCount.mockResolvedValue(0);
    saleFindMany.mockResolvedValue([]);
  });

  it('returns materialized gang with revenue/cogs/profitLoss', async () => {
    gangCount.mockResolvedValue(1);
    gangFindMany.mockResolvedValue([
      {
        gangNo: 1,
        startDate: dt('2026-07-01'),
        endDate: dt('2026-07-03'),
        soldKg: 100,
        cogs: 500,
        saleNosJson: JSON.stringify(['SAL-1', 'SAL-2']),
        salesCount: 2,
      },
    ]);

    saleFindMany.mockResolvedValue([
      { saleNo: 'SAL-1', totalAmount: 1000 },
      { saleNo: 'SAL-2', totalAmount: 1200 },
    ]);

    const req = new NextRequest('http://localhost/api/stock/gangs?productTypeId=pt-1&page=1&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      gangNo: 1,
      soldKg: 100,
      cogs: 500,
      revenue: 2200,
      profitLoss: 1700,
      salesCount: 2,
    });

    expect(gangFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productTypeId: 'pt-1' },
        orderBy: { gangNo: 'desc' },
        skip: 0,
        take: 10,
      }),
    );
    expect(saleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { saleNo: { in: ['SAL-1', 'SAL-2'] } },
      }),
    );
  });

  it('paginates gangs newest -> oldest via gangNo desc', async () => {
    gangCount.mockResolvedValue(2);
    gangFindMany.mockResolvedValue([
      {
        gangNo: 2,
        startDate: dt('2026-07-05'),
        endDate: dt('2026-07-06'),
        soldKg: 50,
        cogs: 250,
        saleNosJson: JSON.stringify(['SAL-2']),
        salesCount: 1,
      },
    ]);
    saleFindMany.mockResolvedValue([{ saleNo: 'SAL-2', totalAmount: 1000 }]);

    const req = new NextRequest('http://localhost/api/stock/gangs?productTypeId=pt-1&page=1&limit=1');
    const res = await GET(req);
    const body = await res.json();

    expect(body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      gangNo: 2,
      soldKg: 50,
      cogs: 250,
      revenue: 1000,
      profitLoss: 750,
      salesCount: 1,
    });
    expect(gangFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 1, orderBy: { gangNo: 'desc' } }),
    );
  });

  it('filters gangs whose cycle overlaps the date range, including open gangs', async () => {
    gangCount.mockResolvedValue(1);
    gangFindMany.mockResolvedValue([
      {
        gangNo: 3,
        startDate: dt('2026-06-20'),
        endDate: null,
        soldKg: 10,
        cogs: 50,
        saleNosJson: JSON.stringify(['SAL-3']),
        salesCount: 1,
      },
    ]);
    saleFindMany.mockResolvedValue([{ saleNo: 'SAL-3', totalAmount: 200 }]);

    const req = new NextRequest(
      'http://localhost/api/stock/gangs?productTypeId=pt-1&startDate=2026-07-01&endDate=2026-07-31',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const where = gangFindMany.mock.calls[0]?.[0]?.where as {
      productTypeId: string;
      AND: Array<Record<string, unknown>>;
    };
    expect(where.productTypeId).toBe('pt-1');
    expect(where.AND).toHaveLength(2);

    const startedByEnd = where.AND.find((clause) => 'startDate' in clause) as {
      startDate: { lte: Date };
    };
    const stillOpenOrEndedAfterStart = where.AND.find((clause) => 'OR' in clause) as {
      OR: Array<Record<string, unknown>>;
    };

    expect(startedByEnd.startDate.lte).toBeInstanceOf(Date);
    expect(startedByEnd.startDate.lte.getHours()).toBe(23);
    expect(stillOpenOrEndedAfterStart.OR).toEqual([
      { endDate: null },
      { endDate: { gte: expect.any(Date) } },
    ]);
    expect(gangCount).toHaveBeenCalledWith({ where });
  });

  it('returns 400 when startDate is after endDate', async () => {
    const req = new NextRequest(
      'http://localhost/api/stock/gangs?productTypeId=pt-1&startDate=2026-07-31&endDate=2026-07-01',
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid date range');
    expect(gangFindMany).not.toHaveBeenCalled();
  });

  describe('with sequential Jan–Sep fixture gangs', () => {
    function overlapping(startDate: string, endDate: string) {
      const parsed = parseGangDateRange(startDate, endDate);
      if (!parsed.ok) throw new Error('invalid fixture range');
      return DATE_FILTER_GANG_FIXTURES.filter((gang) => gangOverlapsRange(gang, parsed));
    }

    function mockFilteredRange(startDate: string, endDate: string) {
      const matched = overlapping(startDate, endDate);
      gangFindMany.mockResolvedValue(matched.map(toApiGangRecord));
      gangCount.mockResolvedValue(matched.length);
      saleFindMany.mockResolvedValue(salesForGangs(matched));
      return matched;
    }

    it.each([
      { startDate: '2026-07-01', endDate: '2026-07-31', gangNos: [7, 8, 9] },
      { startDate: '2026-08-01', endDate: '2026-08-31', gangNos: [9, 10, 11] },
      { startDate: '2026-09-01', endDate: '2026-09-08', gangNos: [11, 12] },
      { startDate: '2026-01-01', endDate: '2026-03-31', gangNos: [1, 2, 3] },
      { startDate: '2026-04-01', endDate: '2026-06-30', gangNos: [4, 5, 6, 7] },
    ])(
      'returns overlapping gangs for $startDate → $endDate',
      async ({ startDate, endDate, gangNos }) => {
        const matched = mockFilteredRange(startDate, endDate);
        expect(fixtureGangNos(matched)).toEqual(gangNos);

        const req = new NextRequest(
          `http://localhost/api/stock/gangs?productTypeId=pt-1&startDate=${startDate}&endDate=${endDate}&limit=50`,
        );
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.map((row: { gangNo: number }) => row.gangNo)).toEqual(gangNos);
        expect(body.pagination.total).toBe(gangNos.length);

        const fullyJuly = body.data.find((row: { gangNo: number }) => row.gangNo === 8);
        if (fullyJuly) {
          expect(fullyJuly).toMatchObject({
            revenue: 7000,
            cogs: 5200,
            profitLoss: 1800,
            salesCount: 2,
          });
        }

        const openGang = body.data.find((row: { gangNo: number }) => row.gangNo === 12);
        if (openGang) {
          expect(openGang).toMatchObject({
            revenue: 2080,
            cogs: 1600,
            profitLoss: 480,
            endDate: null,
          });
        }

        expect(gangFindMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              productTypeId: 'pt-1',
              AND: expect.any(Array),
            }),
          }),
        );
      },
    );
  });
});
