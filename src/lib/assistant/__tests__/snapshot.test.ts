import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShopSnapshot, queryTokens } from '../snapshot';

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

describe('queryTokens', () => {
  it('keeps member codes and ignores a bare number of days', () => {
    expect(queryTokens('สรุปสมาชิก M002 ก่อนเข้าพบ')).toEqual(['M002']);
    expect(queryTokens('สมาชิกคนไหนไม่มารับซื้อเกิน 30 วัน')).toEqual([]);
  });
});

describe('buildShopSnapshot', () => {
  let prisma: PrismaMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = (await import('@/lib/prisma')).prisma as unknown as PrismaMock;

    prisma.purchase.aggregate.mockResolvedValue({
      _count: 3,
      _sum: { dryWeight: 12, totalAmount: 300 },
    });
    prisma.purchase.groupBy.mockImplementation(async (args: {
      by: string[];
      _max?: unknown;
      where?: { isPaid?: boolean; memberId?: string };
    }) => {
      if (args._max) {
        return [{
          memberId: 'member-1',
          _count: 4,
          _max: { date: new Date('2020-01-01T00:00:00.000Z') },
          _sum: { totalAmount: 500 },
        }];
      }
      if (args.where?.memberId) {
        return [{
          productTypeId: 'product-1',
          _count: 2,
          _sum: { dryWeight: 8, totalAmount: 160 },
          _avg: { rubberPercent: 32.5, finalPrice: 45 },
        }];
      }
      if (args.where?.isPaid === false) {
        return [{ memberId: 'member-1', _count: 1, _sum: { totalAmount: 40 } }];
      }
      if (args.by[0] === 'memberId') {
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
    prisma.member.findMany.mockImplementation(async (args: {
      where?: { purchases?: unknown; code?: { in: string[] }; id?: { in: string[] } };
      select?: Record<string, boolean>;
    }) => {
      expect(args.select).not.toHaveProperty('phone');
      expect(args.select).not.toHaveProperty('idCard');
      expect(args.select).not.toHaveProperty('bankAccount');
      if (args.where?.purchases) {
        return [{ code: 'M009', name: 'สมหญิง' }];
      }
      if (args.where?.code) {
        return [{
          id: 'member-2',
          code: 'M002',
          name: 'สมศักดิ์',
          advanceBalance: 100,
          idCard: '1103700000000',
          bankAccount: '1234567890',
          phone: '0812345678',
        }];
      }
      return [{ id: 'member-1', code: 'M001', name: 'สมชาย', phone: '0899999999' }];
    });
  });

  it('omits private member fields and includes quiet members plus a named brief', async () => {
    const snapshot = await buildShopSnapshot('สรุปสมาชิก M002 ก่อนเข้าพบ', new Date('2026-04-15T03:00:00.000Z'));

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
    expect(serialized).not.toContain('0812345678');
    expect(serialized).not.toContain('1103700000000');
    expect(serialized).not.toContain('1234567890');
    expect(serialized).not.toContain('phone');
    expect(serialized).not.toContain('idCard');
    expect(serialized).not.toContain('bankAccount');
    expect(snapshot.purchases.topMembersThisMonth[0]).toMatchObject({ code: 'M001', member: 'สมชาย' });
    expect(snapshot.profit.monthNet).toBe(450);
    expect(snapshot.stock[0]).toEqual({ productType: 'ยางแผ่น', kg: 25.5, avgCostPerKg: 40 });
    expect(snapshot.quietMembers.map((member) => member.code)).toEqual(['M001']);
    expect(snapshot.quietMembers[0].daysSince).toBeGreaterThan(30);
    expect(snapshot.neverPurchased).toEqual([{ code: 'M009', member: 'สมหญิง' }]);
    expect(snapshot.purchases.unpaidByMemberThisMonth[0]).toMatchObject({ code: 'M001', amount: 40 });
    expect(snapshot.memberBrief).toMatchObject({
      code: 'M002',
      member: 'สมศักดิ์',
      advanceBalance: 100,
      unpaidAmount: 300,
      last12Months: [{ productType: 'ยางแผ่น', kg: 8, avgRubberPercent: 32.5, avgFinalPrice: 45 }],
    });
  });
});
