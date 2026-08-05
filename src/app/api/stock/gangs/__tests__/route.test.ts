import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

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
});
