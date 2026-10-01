import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShopSnapshot } from '../snapshot';

vi.mock('@/platform/prisma', () => ({
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

type PrismaMock = {
  purchase: { aggregate: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  sale: { aggregate: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  stockPosition: { findMany: ReturnType<typeof vi.fn> };
  expense: { aggregate: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn> };
  serviceFee: { aggregate: ReturnType<typeof vi.fn> };
  productPrice: { findMany: ReturnType<typeof vi.fn> };
  productType: { findMany: ReturnType<typeof vi.fn> };
  member: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
};

function tenantIds(mockFn: ReturnType<typeof vi.fn>): unknown[] {
  return mockFn.mock.calls.map((call) => (call[0] as { where?: { tenantId?: string } })?.where?.tenantId);
}

describe('buildShopSnapshot', () => {
  let prisma: PrismaMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import('@/platform/prisma')).prisma as unknown as PrismaMock;

    prisma.purchase.aggregate.mockResolvedValue({
      _count: 3,
      _sum: { dryWeight: 12, totalAmount: 300 },
    });
    prisma.purchase.groupBy.mockImplementation(async ({ by }: { by: string[] }) => {
      if (by[0] === 'memberId') {
        return [{ memberId: 'member-1', _count: 2, _sum: { dryWeight: 5, totalAmount: 80 } }];
      }
      return [{ productTypeId: 'product-1', _count: 2, _sum: { dryWeight: 5, totalAmount: 80 } }];
    });
    prisma.purchase.findMany.mockResolvedValue([
      {
        date: new Date('2026-03-01T02:00:00.000Z'),
        purchaseNo: 'P001',
        dryWeight: 10,
        totalAmount: 100,
        member: { name: 'สมชาย', phone: '0899999999', idCard: '1103700000000', bankAccount: '1234567890' },
        productType: { name: 'ยางแผ่น' },
      },
    ]);
    prisma.sale.aggregate.mockResolvedValue({
      _count: 2,
      _sum: { weight: 10, totalAmount: 1000, costOfGoods: 400 },
    });
    prisma.sale.groupBy.mockImplementation(async ({ by }: { by: string[] }) => {
      if (by[0] === 'companyName') {
        return [{ companyName: 'บริษัทเอ', _count: 1, _sum: { weight: 4, totalAmount: 200 } }];
      }
      return [{ productTypeId: 'product-1', _count: 1, _sum: { weight: 4, totalAmount: 200 } }];
    });
    prisma.sale.findMany.mockResolvedValue([]);
    prisma.stockPosition.findMany.mockResolvedValue([
      { quantityKg: 25.5, avgCostPerKg: 40, productType: { name: 'ยางแผ่น' } },
    ]);
    prisma.expense.aggregate.mockResolvedValue({ _count: 1, _sum: { amount: 100 } });
    prisma.expense.groupBy.mockResolvedValue([
      { category: 'ค่าน้ำมัน', _count: 1, _sum: { amount: 100 } },
    ]);
    prisma.serviceFee.aggregate.mockResolvedValue({ _sum: { amount: 50 } });
    prisma.productPrice.findMany.mockResolvedValue([{ price: 61, productType: { name: 'ยางแผ่น' } }]);
    prisma.productType.findMany.mockResolvedValue([{ id: 'product-1', name: 'ยางแผ่น' }]);
    prisma.member.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    prisma.member.findMany.mockResolvedValue([{ id: 'member-1', name: 'สมชาย' }]);
  });

  it('scopes every query to the requested tenant and omits private member fields', async () => {
    const snapshot = await buildShopSnapshot('tenant-abc');

    const scoped = [
      prisma.purchase.aggregate,
      prisma.purchase.groupBy,
      prisma.purchase.findMany,
      prisma.sale.aggregate,
      prisma.sale.groupBy,
      prisma.sale.findMany,
      prisma.stockPosition.findMany,
      prisma.expense.aggregate,
      prisma.expense.groupBy,
      prisma.serviceFee.aggregate,
      prisma.productPrice.findMany,
      prisma.productType.findMany,
      prisma.member.count,
      prisma.member.findMany,
    ];

    for (const mockFn of scoped) {
      expect(mockFn).toHaveBeenCalled();
      expect(tenantIds(mockFn).every((tenantId) => tenantId === 'tenant-abc')).toBe(true);
    }

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-abc', id: { in: ['member-1'] } },
        select: { id: true, name: true },
      }),
    );
    expect(prisma.purchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          date: true,
          purchaseNo: true,
          dryWeight: true,
          totalAmount: true,
          member: { select: { name: true } },
          productType: { select: { name: true } },
        },
      }),
    );

    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain('0899999999');
    expect(serialized).not.toContain('1103700000000');
    expect(serialized).not.toContain('1234567890');
    expect(serialized).not.toContain('phone');
    expect(serialized).not.toContain('idCard');
    expect(serialized).not.toContain('bankAccount');
    expect(snapshot.purchases.topMembersThisMonth[0].member).toBe('สมชาย');
    expect(snapshot.profit.monthNet).toBe(450);
    expect(snapshot.stock[0]).toEqual({ productType: 'ยางแผ่น', kg: 25.5, avgCostPerKg: 40 });
  });
});
