import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

const findMany = vi.fn();
const count = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sale: {
      findMany: (...args: unknown[]) => findMany(...args),
      count: (...args: unknown[]) => count(...args),
    },
    productType: {
      findMany: vi.fn().mockResolvedValue([]),
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

vi.mock('@/lib/utils', () => ({
  generateDocumentNumber: vi.fn(),
  getUserFromToken: vi.fn(),
}));

vi.mock('@/lib/stock/stockService', () => ({
  applySaleToStock: vi.fn(),
  StockInsufficientError: class StockInsufficientError extends Error {},
}));

function baseSale(id: string) {
  return {
    id,
    saleNo: `SAL-${id}`,
    date: new Date('2026-07-01'),
    userId: 'user-1',
    companyName: 'บริษัท ทดสอบ',
    productTypeId: 'pt-1',
    weight: 100,
    rubberPercent: 60,
    pricePerUnit: 45,
    expenseType: null,
    expenseCost: null,
    sellingType: 'จ่ายสด',
    totalAmount: 4500,
    unitCostPerKg: null as number | null,
    costOfGoods: null as number | null,
    notes: null,
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
    productType: { id: 'pt-1', code: 'R1', name: 'ยาง' },
  };
}

function makeSale(id: string, overrides: Partial<ReturnType<typeof baseSale>> = {}) {
  return { ...baseSale(id), ...overrides };
}

function withIsoDates<T extends { date: Date; createdAt: Date; updatedAt: Date }>(row: T) {
  return {
    ...row,
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

describe('GET /api/sales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated payload with skip/take when page is provided', async () => {
    const pageRows = [makeSale('1'), makeSale('2')];
    findMany.mockResolvedValue(pageRows);
    count.mockResolvedValue(100_000);

    const req = new NextRequest('http://localhost/api/sales?page=3&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      data: pageRows.map((row) =>
        withIsoDates({
          ...row,
          profitLoss: null,
        }),
      ),
      pagination: {
        page: 3,
        limit: 10,
        total: 100_000,
        totalPages: 10_000,
      },
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );
    expect(count).toHaveBeenCalledTimes(1);
  });

  it('attaches profit/loss from denormalized Sale COGS columns', async () => {
    const sale = makeSale('1', {
      weight: 100,
      pricePerUnit: 50,
      totalAmount: 4800,
      expenseCost: 200,
      unitCostPerKg: 40,
      costOfGoods: 4000,
    });
    findMany.mockResolvedValue([sale]);
    count.mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/sales?page=1&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      unitCostPerKg: 40,
      costOfGoods: 4000,
      profitLoss: 800,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          unitCostPerKg: true,
          costOfGoods: true,
        }),
      }),
    );
  });

  it('derives costOfGoods from unitCostPerKg when costOfGoods is null', async () => {
    const sale = makeSale('1', {
      weight: 100,
      totalAmount: 5000,
      unitCostPerKg: 40,
      costOfGoods: null,
    });
    findMany.mockResolvedValue([sale]);
    count.mockResolvedValue(1);

    const req = new NextRequest('http://localhost/api/sales?page=1&limit=10');
    const res = await GET(req);
    const body = await res.json();

    expect(body.data[0]).toMatchObject({
      unitCostPerKg: 40,
      costOfGoods: 4000,
      profitLoss: 1000,
    });
  });

  it('caps limit at 200', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/sales?page=1&limit=999');
    await GET(req);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 200,
      }),
    );
  });

  it('returns a capped bare array when page is omitted', async () => {
    const rows = [makeSale('1')];
    findMany.mockResolvedValue(rows);

    const req = new NextRequest('http://localhost/api/sales');
    const res = await GET(req);
    const body = await res.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      profitLoss: null,
      costOfGoods: null,
      unitCostPerKg: null,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1000,
      }),
    );
    expect(count).not.toHaveBeenCalled();
  });

  it('applies search filters when searching', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/sales?page=1&limit=10&search=ยางไทย');
    await GET(req);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { saleNo: { contains: 'ยางไทย' } },
            { companyName: { contains: 'ยางไทย' } },
          ]),
        }),
        skip: 0,
        take: 10,
      }),
    );
  });
});
