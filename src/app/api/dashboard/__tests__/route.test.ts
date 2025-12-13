import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    member: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findUnique: vi.fn(),
    },
    productPrice: {
      findMany: vi.fn(),
    },
    productType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  CACHE_KEYS: {
    DASHBOARD: 'dashboard',
  },
  CACHE_TTL: {
    DASHBOARD: 300000,
  },
}));

describe('GET /api/dashboard', () => {
  let prisma: any;
  let logger: any;
  let cache: any;

  const mockMember = {
    id: 'member-1',
    code: 'M001',
    name: 'Test Member',
    isActive: true,
  };

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
    isActive: true,
  };

  const mockPurchase = {
    id: 'purchase-1',
    purchaseNo: 'PUR-202401-0001',
    date: new Date('2024-01-15'),
    memberId: 'member-1',
    productTypeId: 'product-1',
    totalAmount: 5000,
    dryWeight: 100,
    member: mockMember,
    productType: mockProductType,
  };

  const mockExpense = {
    id: 'expense-1',
    expenseNo: 'EXP-20240115-001',
    date: new Date('2024-01-15'),
    category: 'ค่าน้ำมัน',
    amount: 500,
  };

  const mockProductPrice = {
    id: 'price-1',
    date: new Date('2024-01-15'),
    productTypeId: 'product-1',
    price: 50,
    productType: mockProductType,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    const cacheModule = await import('@/lib/cache');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
    cache = cacheModule.cache;
    
    // Clear cache before each test
    vi.mocked(cache.get).mockReturnValue(null);
  });

  describe('Successful retrieval', () => {
    it('should return all dashboard data', async () => {
      // Mock all Prisma calls
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 5, _sum: { totalAmount: 25000 } }) // Today purchases
        .mockResolvedValueOnce({ _count: 50, _sum: { totalAmount: 250000 } }) // Month purchases
        .mockResolvedValueOnce({ _sum: { totalAmount: 10000 } }); // Unpaid amount

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(100) // Total members
        .mockResolvedValueOnce(80); // Active members

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 5000 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([
          { memberId: 'member-1', _sum: { totalAmount: 10000, dryWeight: 200 } },
        ])
        .mockResolvedValueOnce([]); // todayPurchasesByProductType

      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);

      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockProductPrice]);

      vi.mocked(prisma.productType.findMany).mockResolvedValue([mockProductType]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 3, _sum: { amount: 1500 } }) // Today expenses
        .mockResolvedValueOnce({ _count: 30, _sum: { amount: 15000 } }); // Month expenses

      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toBeDefined();
      expect(data.recentPurchases).toBeDefined();
      expect(data.topMembers).toBeDefined();
      expect(data.todayPrices).toBeDefined();
      expect(data.productTypes).toBeDefined();
      expect(data.recentExpenses).toBeDefined();
    });

    it('should return correct statistics', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 10, _sum: { totalAmount: 50000 } })
        .mockResolvedValueOnce({ _count: 100, _sum: { totalAmount: 500000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 20000 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(120);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 10000 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 5, _sum: { amount: 2500 } })
        .mockResolvedValueOnce({ _count: 50, _sum: { amount: 25000 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.todayPurchases).toBe(10);
      expect(data.stats.todayAmount).toBe(50000);
      expect(data.stats.monthPurchases).toBe(100);
      expect(data.stats.monthAmount).toBe(500000);
      expect(data.stats.totalMembers).toBe(150);
      expect(data.stats.activeMembers).toBe(120);
      expect(data.stats.totalAdvance).toBe(10000);
      expect(data.stats.unpaidAmount).toBe(20000);
      expect(data.stats.todayExpenses).toBe(5);
      expect(data.stats.todayExpenseAmount).toBe(2500);
      expect(data.stats.monthExpenses).toBe(50);
      expect(data.stats.monthExpenseAmount).toBe(25000);
    });

    it('should handle null sum values', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: null } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: null } })
        .mockResolvedValueOnce({ _sum: { totalAmount: null } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: null },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: null } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: null } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.todayAmount).toBe(0);
      expect(data.stats.monthAmount).toBe(0);
      expect(data.stats.totalAdvance).toBe(0);
      expect(data.stats.unpaidAmount).toBe(0);
      expect(data.stats.todayExpenseAmount).toBe(0);
      expect(data.stats.monthExpenseAmount).toBe(0);
    });

    it('should return recent purchases with member and productType', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);
      vi.mocked(prisma.purchase.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recentPurchases).toHaveLength(1);
      expect(data.recentPurchases[0].member).toBeDefined();
      expect(data.recentPurchases[0].productType).toBeDefined();
    });

    it('should return top members with details', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);

      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([
          { memberId: 'member-1', _sum: { totalAmount: 15000, dryWeight: 300 } },
          { memberId: 'member-2', _sum: { totalAmount: 10000, dryWeight: 200 } },
        ])
        .mockResolvedValueOnce([]); // todayPurchasesByProductType

      vi.mocked(prisma.member.findUnique)
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce({ ...mockMember, id: 'member-2' });

      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.topMembers).toHaveLength(2);
      expect(data.topMembers[0].member).toBeDefined();
      expect(data.topMembers[0].totalAmount).toBe(15000);
      expect(data.topMembers[0].totalWeight).toBe(300);
    });

    it('should handle top members with null sums', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);

      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([
          { memberId: 'member-1', _sum: { totalAmount: null, dryWeight: null } },
        ])
        .mockResolvedValueOnce([]); // todayPurchasesByProductType

      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.topMembers[0].totalAmount).toBe(0);
      expect(data.topMembers[0].totalWeight).toBe(0);
    });

    it('should return today prices with productType', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy).mockResolvedValue([]);

      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockProductPrice]);

      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.todayPrices).toHaveLength(1);
      expect(data.todayPrices[0].productType).toBeDefined();
    });

    it('should return active product types', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);

      vi.mocked(prisma.productType.findMany).mockResolvedValue([mockProductType]);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productTypes).toHaveLength(1);
      expect(vi.mocked(prisma.productType.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should return recent expenses', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recentExpenses).toHaveLength(1);
      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: { date: 'desc' },
        })
      );
    });

    it('should limit recent purchases to 10', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should limit top members to 5', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(vi.mocked(prisma.purchase.groupBy)).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.purchase.aggregate).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูล');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('GET /api/dashboard - Failed', dbError);
    });

    it('should return 500 when member query fails', async () => {
      vi.mocked(prisma.purchase.aggregate).mockResolvedValue({ _count: 0, _sum: { totalAmount: 0 } });
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.member.count).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูล');
    });
  });

  describe('Logging', () => {
    it('should log the GET request', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { totalAmount: 0 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith('GET /api/dashboard - Request received');
    });

    it('should log success with purchase counts', async () => {
      vi.mocked(prisma.purchase.aggregate)
        .mockResolvedValueOnce({ _count: 10, _sum: { totalAmount: 50000 } })
        .mockResolvedValueOnce({ _count: 100, _sum: { totalAmount: 500000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

      vi.mocked(prisma.member.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.member.aggregate).mockResolvedValue({
        _sum: { advanceBalance: 0 },
      });

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.purchase.groupBy)
        .mockResolvedValueOnce([]) // topMembers
        .mockResolvedValueOnce([]); // todayPurchasesByProductType
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: 0 } });

      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/dashboard');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/dashboard - Success',
        expect.objectContaining({
          todayPurchases: 10,
          monthPurchases: 100,
        })
      );
    });
  });
});

