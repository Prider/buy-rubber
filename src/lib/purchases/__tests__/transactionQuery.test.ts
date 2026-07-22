import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  buildTransactionPrismaWhere,
  countTransactionGroups,
  fetchPaginatedTransactionGroups,
  parseTransactionDateRange,
  resolveDefaultDateRange,
  type TransactionQueryFilters,
} from '@/lib/purchases/transactionQuery';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    member: {
      findMany: vi.fn(),
    },
  },
}));

describe('transactionQuery', () => {
  const filters: TransactionQueryFilters = {
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: new Date('2024-01-31T23:59:59.999Z'),
    searchTerm: 'PUR',
    searchMemberIds: ['member-1', 'member-2'],
  };

  it('builds prisma where with date range and search OR conditions', () => {
    const where = buildTransactionPrismaWhere(filters);

    expect(where.date).toEqual({
      gte: filters.startDate,
      lte: filters.endDate,
    });
    expect(where.OR).toEqual([
      { purchaseNo: { contains: 'PUR' } },
      { memberId: { in: ['member-1', 'member-2'] } },
    ]);
  });

  it('counts grouped transactions with SQL instead of loading all groups', async () => {
    const prisma = (await import('@/lib/prisma')).prisma;
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: 42 }]);

    const total = await countTransactionGroups(filters);

    expect(total).toBe(42);
    expect(prisma.$queryRaw).toHaveBeenCalledWith(
      expect.objectContaining({
        strings: expect.arrayContaining([
          expect.stringContaining('SELECT COUNT(*) AS count'),
          expect.stringContaining('GROUP BY "purchaseNo", "memberId"'),
        ]),
      }),
    );
  });

  it('fetches paginated grouped transactions with limit and offset', async () => {
    const prisma = (await import('@/lib/prisma')).prisma;
    vi.mocked(prisma.$queryRaw).mockReset();
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        purchaseNo: 'PUR-01',
        memberId: 'member-1',
        maxCreatedAt: new Date('2024-01-15T10:00:00.000Z'),
        maxDate: new Date('2024-01-15T00:00:00.000Z'),
        sumTotalAmount: 1500,
      },
    ]);

    const rows = await fetchPaginatedTransactionGroups(filters, 2, 10);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      purchaseNo: 'PUR-01',
      memberId: 'member-1',
      sumTotalAmount: 1500,
    });

    const sqlArg = vi.mocked(prisma.$queryRaw).mock.calls[0][0] as Prisma.Sql;
    expect(sqlArg.strings.join(' ')).toContain('LIMIT');
    expect(sqlArg.strings.join(' ')).toContain('OFFSET');
    expect(sqlArg.values).toEqual(expect.arrayContaining([10, 10]));
  });

  it('uses a 90-day default date range when params are missing', () => {
    const { startDate, endDate } = resolveDefaultDateRange();
    const parsed = parseTransactionDateRange(null, null);

    expect(parsed.startDate.getTime()).toBe(startDate.getTime());
    expect(parsed.endDate.getTime()).toBe(endDate.getTime());
  });
});
