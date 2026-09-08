import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as transactionQuery from '@/lib/purchases/transactionQuery';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findMany: vi.fn(),
    },
    serviceFee: {
      findMany: vi.fn(),
    },
    member: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/purchases/transactionQuery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/purchases/transactionQuery')>();
  return {
    ...actual,
    countTransactionGroups: vi.fn(),
    fetchPaginatedTransactionGroups: vi.fn(),
    resolveSearchMemberIds: vi.fn(),
  };
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GET /api/purchases/transactions', () => {
  let prisma: any;
  let logger: any;

  const mockMember = {
    id: 'member-1',
    code: 'M001',
    name: 'Test Member',
  };

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
  };

  const mockPurchase1 = {
    id: 'purchase-1',
    purchaseNo: 'PUR-202401-0001',
    date: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15T10:00:00'),
    memberId: 'member-1',
    productTypeId: 'product-1',
    userId: 'user-1',
    grossWeight: 100,
    containerWeight: 5,
    netWeight: 95,
    rubberPercent: 60,
    dryWeight: 57,
    basePrice: 50,
    adjustedPrice: 50,
    bonusPrice: 0,
    finalPrice: 50,
    totalAmount: 4750,
    ownerAmount: 4750,
    tapperAmount: 0,
    isPaid: false,
    notes: null,
    updatedAt: new Date('2024-01-15'),
    member: mockMember,
    productType: mockProductType,
    user: mockUser,
  };

  const mockPurchase2 = {
    id: 'purchase-2',
    purchaseNo: 'PUR-202401-0001', // Same purchaseNo as purchase-1
    date: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15T11:00:00'),
    memberId: 'member-1',
    productTypeId: 'product-1',
    userId: 'user-1',
    grossWeight: 200,
    containerWeight: 10,
    netWeight: 190,
    rubberPercent: 60,
    dryWeight: 114,
    basePrice: 50,
    adjustedPrice: 50,
    bonusPrice: 0,
    finalPrice: 50,
    totalAmount: 9500,
    ownerAmount: 9500,
    tapperAmount: 0,
    isPaid: false,
    notes: null,
    updatedAt: new Date('2024-01-15'),
    member: mockMember,
    productType: mockProductType,
    user: mockUser,
  };

  const mockPurchase3 = {
    id: 'purchase-3',
    purchaseNo: 'PUR-202401-0002',
    date: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16T10:00:00'),
    memberId: 'member-1',
    productTypeId: 'product-1',
    userId: 'user-1',
    grossWeight: 150,
    containerWeight: 5,
    netWeight: 145,
    rubberPercent: 60,
    dryWeight: 87,
    basePrice: 50,
    adjustedPrice: 50,
    bonusPrice: 0,
    finalPrice: 50,
    totalAmount: 7250,
    ownerAmount: 7250,
    tapperAmount: 0,
    isPaid: false,
    notes: null,
    updatedAt: new Date('2024-01-16'),
    member: mockMember,
    productType: mockProductType,
    user: mockUser,
  };

  const mockServiceFee1 = {
    id: 'servicefee-1',
    serviceFeeNo: 'SVC-202401-0001',
    purchaseNo: 'PUR-202401-0001',
    date: new Date('2024-01-15'),
    category: 'ค่าขนส่ง',
    amount: 100,
    notes: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockServiceFee2 = {
    id: 'servicefee-2',
    serviceFeeNo: 'SVC-202401-0002',
    purchaseNo: 'PUR-202401-0001',
    date: new Date('2024-01-15'),
    category: 'ค่าบริการ',
    amount: 50,
    notes: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  function mockGroupedTransactions(
    pageRows: Array<{
      purchaseNo: string;
      memberId?: string;
      _max?: { createdAt?: Date; date?: Date };
      _sum?: { totalAmount?: number };
    }>,
    total?: number,
  ) {
    const normalized = pageRows.map((row) => ({
      purchaseNo: row.purchaseNo,
      memberId: row.memberId ?? 'member-1',
      maxCreatedAt: row._max?.createdAt ?? null,
      maxDate: row._max?.date ?? null,
      sumTotalAmount: row._sum?.totalAmount ?? 0,
    }));

    vi.mocked(transactionQuery.countTransactionGroups).mockResolvedValue(total ?? normalized.length);
    vi.mocked(transactionQuery.fetchPaginatedTransactionGroups).mockResolvedValue(normalized);
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    const { cache } = await import('@/lib/cache');
    cache.clear();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;

    vi.mocked(transactionQuery.resolveSearchMemberIds).mockResolvedValue(undefined);
    vi.mocked(transactionQuery.countTransactionGroups).mockResolvedValue(0);
    vi.mocked(transactionQuery.fetchPaginatedTransactionGroups).mockResolvedValue([]);
    
    // Default mock for member.findMany
    vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);
  });

  describe('Successful retrieval', () => {
    it('should return all transactions when no filters are provided', async () => {
      // Mock groupBy to return grouped purchaseNos
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T11:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 14250,
          },
        },
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
      ]);
      
      // Mock findMany for purchases (called with purchaseNo filter)
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1, mockPurchase3]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toBeDefined();
      expect(Array.isArray(data.transactions)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it('should group purchases by purchaseNo', async () => {
      // Mock groupBy to return one grouped purchaseNo
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T11:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 14250, // 4750 + 9500
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1, mockPurchase2]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].purchaseNo).toBe('PUR-202401-0001');
      expect(data.transactions[0].purchases).toHaveLength(2);
      expect(data.transactions[0].totalAmount).toBe(14250); // 4750 + 9500
    });

    it('should subtract service fees from totalAmount', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee1, mockServiceFee2]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].totalAmount).toBe(4600); // 4750 - 100 - 50
      expect(data.transactions[0].serviceFees).toHaveLength(2);
    });

    it('should filter transactions by startDate', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase3]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?startDate=2024-01-16');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter transactions by endDate', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?endDate=2024-01-15');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter transactions by date range', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?startDate=2024-01-01&endDate=2024-01-31');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should filter transactions by memberId', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?memberId=member-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should search transactions by purchaseNo', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?search=0001');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].purchaseNo).toBe('PUR-202401-0001');
    });

    it('should search transactions by member name', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1, mockPurchase3]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?search=Test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions.length).toBeGreaterThan(0);
      expect(data.transactions.every((t: any) => 
        t.member.name.toLowerCase().includes('test')
      )).toBe(true);
    });

    it('should search transactions by member code', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1, mockPurchase3]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?search=M001');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions.length).toBeGreaterThan(0);
      expect(data.transactions.every((t: any) => 
        t.member.code.toLowerCase().includes('m001')
      )).toBe(true);
    });

    it('should paginate transactions correctly', async () => {
      // Mock groupBy to return 25 distinct purchaseNos
      // They will be sorted by date/createdAt descending, then by purchaseNo descending
      // So the first page will have the newest purchaseNos (which are the higher numbers if dates are same)
      const purchaseNoGroups = Array.from({ length: 25 }, (_, i) => ({
        purchaseNo: `PUR-202401-${String(i + 1).padStart(4, '0')}`,
        memberId: 'member-1',
        _max: {
          // Use same date for all to test purchaseNo sorting
          createdAt: new Date('2024-01-15T10:00:00'),
          date: new Date('2024-01-15'),
        },
        _sum: {
          totalAmount: 4750,
        },
      }));
      
      mockGroupedTransactions(purchaseNoGroups);
      
      // After sorting, purchaseNos will be in descending order (25, 24, 23, ...)
      // So page 1 will have purchaseNos 25, 24, 23, 22, 21, 20, 19, 18, 17, 16
      // Mock findMany to return purchases for those purchaseNos
      const purchases = Array.from({ length: 10 }, (_, i) => ({
        ...mockPurchase1,
        id: `purchase-${24 - i}`,
        purchaseNo: `PUR-202401-${String(25 - i).padStart(4, '0')}`, // 25, 24, 23, ..., 16
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15T10:00:00'),
      }));

      vi.mocked(prisma.purchase.findMany).mockResolvedValue(purchases);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Each purchaseNo should create one transaction
      expect(data.transactions.length).toBe(10);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should handle pagination on second page', async () => {
      const purchaseNoGroups = Array.from({ length: 25 }, (_, i) => ({
        purchaseNo: `PUR-202401-${String(i + 1).padStart(4, '0')}`,
        memberId: 'member-1',
        _max: {
          // Use same date for all to test purchaseNo sorting
          createdAt: new Date('2024-01-15T10:00:00'),
          date: new Date('2024-01-15'),
        },
        _sum: {
          totalAmount: 4750,
        },
      }));
      
      mockGroupedTransactions(purchaseNoGroups);
      
      // After sorting, purchaseNos will be in descending order (25, 24, 23, ...)
      // So page 2 will have purchaseNos 15, 14, 13, 12, 11, 10, 9, 8, 7, 6
      // Mock findMany to return purchases for those purchaseNos
      const purchases = Array.from({ length: 10 }, (_, i) => ({
        ...mockPurchase1,
        id: `purchase-${14 - i}`,
        purchaseNo: `PUR-202401-${String(15 - i).padStart(4, '0')}`, // 15, 14, 13, ..., 6
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15T10:00:00'),
      }));

      vi.mocked(prisma.purchase.findMany).mockResolvedValue(purchases);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?page=2&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Each purchaseNo should create one transaction
      expect(data.transactions.length).toBe(10);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should handle pagination on last page', async () => {
      const purchaseNoGroups = Array.from({ length: 25 }, (_, i) => ({
        purchaseNo: `PUR-202401-${String(i + 1).padStart(4, '0')}`,
        memberId: 'member-1',
        _max: {
          // Use same date for all to test purchaseNo sorting
          createdAt: new Date('2024-01-15T10:00:00'),
          date: new Date('2024-01-15'),
        },
        _sum: {
          totalAmount: 4750,
        },
      }));
      
      mockGroupedTransactions(purchaseNoGroups);
      
      // After sorting, purchaseNos will be in descending order (25, 24, 23, ...)
      // So page 3 will have purchaseNos 5, 4, 3, 2, 1 (last 5)
      // Mock findMany to return purchases for those purchaseNos
      const purchases = Array.from({ length: 5 }, (_, i) => ({
        ...mockPurchase1,
        id: `purchase-${4 - i}`,
        purchaseNo: `PUR-202401-${String(5 - i).padStart(4, '0')}`, // 5, 4, 3, 2, 1
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15T10:00:00'),
      }));

      vi.mocked(prisma.purchase.findMany).mockResolvedValue(purchases);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?page=3&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Each purchaseNo should create one transaction
      expect(data.transactions.length).toBe(5);
      expect(data.pagination.page).toBe(3);
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should sort transactions by date (newest first)', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      const purchaseOld = {
        ...mockPurchase1,
        id: 'purchase-old',
        purchaseNo: 'PUR-202401-0001',
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15T10:00:00'),
      };
      const purchaseNew = {
        ...mockPurchase3,
        id: 'purchase-new',
        purchaseNo: 'PUR-202401-0002',
        date: new Date('2024-01-16'),
        createdAt: new Date('2024-01-16T10:00:00'),
      };

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([purchaseNew, purchaseOld]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(2);
      // Transactions are sorted by newest first (date and createdAt descending)
      expect(data.transactions[0].purchaseNo).toBe('PUR-202401-0002'); // Newer date (2024-01-16)
      expect(data.transactions[1].purchaseNo).toBe('PUR-202401-0001'); // Older date (2024-01-15)
    });

    it('should use most recent createdAt when grouping purchases with same purchaseNo', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T11:00:00'), // More recent
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 14250,
          },
        },
      ]);
      
      const purchase1 = {
        ...mockPurchase1,
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15T10:00:00'),
      };
      const purchase2 = {
        ...mockPurchase2,
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15T11:00:00'), // More recent
      };

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([purchase1, purchase2]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(1);
      // createdAt is serialized as ISO string in JSON response
      const transactionCreatedAt = new Date(data.transactions[0].createdAt).getTime();
      expect(transactionCreatedAt).toBe(purchase2.createdAt.getTime());
    });

    it('should handle empty purchases array', async () => {
      mockGroupedTransactions([]);
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
    });

    it('should handle purchases with no service fees', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].totalAmount).toBe(4750);
      expect(data.transactions[0].serviceFees).toHaveLength(0);
    });

    it('should combine multiple filters', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?startDate=2024-01-01&endDate=2024-01-31&memberId=member-1&search=Test&page=1&limit=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(transactionQuery.fetchPaginatedTransactionGroups).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลการรับซื้อ');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });

    it('should return 500 when service fee query fails', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      const dbError = new Error('Service fee query failed');
      vi.mocked(prisma.serviceFee.findMany).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลการรับซื้อ');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log the GET request with parameters', async () => {
      mockGroupedTransactions([]);
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?startDate=2024-01-01&memberId=member-1&page=1&limit=20');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/purchases/transactions',
        expect.objectContaining({
          startDate: '2024-01-01',
          memberId: 'member-1',
          page: 1,
          limit: 20,
        })
      );
    });

    it('should log success with count and pagination', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/purchases/transactions - Success',
        expect.objectContaining({
          count: 1,
          total: 1,
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle default pagination values when not provided', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(20);
    });

    it('should handle invalid page number', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?page=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // parseInt('abc') returns NaN, which gets serialized as null in JSON
      // The route doesn't validate NaN, so it uses NaN in calculations which becomes null in JSON
      expect(data.pagination.page).toBeNull();
    });

    it('should handle invalid limit number', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions?limit=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // parseInt('abc') returns NaN, which gets serialized as null in JSON
      // The route doesn't validate NaN, so it uses NaN in calculations which becomes null in JSON
      expect(data.pagination.limit).toBeNull();
    });

    it('should handle purchases without createdAt', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: null,
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
      ]);
      
      const purchaseWithoutCreatedAt = {
        ...mockPurchase1,
        createdAt: null as any,
      };

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([purchaseWithoutCreatedAt]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].date).toBeDefined();
    });

    it('should handle service fees for multiple purchaseNos', async () => {
      mockGroupedTransactions([
        {
          purchaseNo: 'PUR-202401-0001',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-15T10:00:00'),
            date: new Date('2024-01-15'),
          },
          _sum: {
            totalAmount: 4750,
          },
        },
        {
          purchaseNo: 'PUR-202401-0002',
          memberId: 'member-1',
          _max: {
            createdAt: new Date('2024-01-16T10:00:00'),
            date: new Date('2024-01-16'),
          },
          _sum: {
            totalAmount: 7250,
          },
        },
      ]);

      const purchase1 = { ...mockPurchase1, purchaseNo: 'PUR-202401-0001' };
      const purchase2 = { ...mockPurchase3, purchaseNo: 'PUR-202401-0002' };
      const serviceFee1 = { ...mockServiceFee1, purchaseNo: 'PUR-202401-0001' };
      const serviceFee2 = { ...mockServiceFee1, id: 'servicefee-2', purchaseNo: 'PUR-202401-0002' };

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([purchase1, purchase2]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([serviceFee1, serviceFee2]);

      const request = new NextRequest('http://localhost:3000/api/purchases/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.transactions).toHaveLength(2);
      expect(data.transactions[0].serviceFees).toHaveLength(1);
      expect(data.transactions[1].serviceFees).toHaveLength(1);
    });
  });

  describe('DB-level pagination (scalability fix)', () => {
    it('uses SQL count and paginated group queries', async () => {
      const pageRows = [
        {
          purchaseNo: 'PUR-01',
          memberId: 'member-1',
          _max: { createdAt: new Date('2024-01-15T10:00:00'), date: new Date('2024-01-15') },
          _sum: { totalAmount: 1000 },
        },
      ];

      mockGroupedTransactions(pageRows, 3);

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?page=1&limit=1&startDate=2024-01-01&endDate=2024-01-31',
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(transactionQuery.countTransactionGroups).toHaveBeenCalledTimes(1);
      expect(transactionQuery.fetchPaginatedTransactionGroups).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
        1,
        1,
      );
      expect(data.pagination.total).toBe(3);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('reuses the cached group count on later pages instead of recounting', async () => {
      mockGroupedTransactions(
        [
          {
            purchaseNo: 'PUR-01',
            memberId: 'member-1',
            _max: { createdAt: new Date('2024-01-15T10:00:00'), date: new Date('2024-01-15') },
            _sum: { totalAmount: 1000 },
          },
        ],
        40,
      );
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase1]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const query = 'startDate=2024-01-01&endDate=2024-01-31&limit=1';
      await GET(new NextRequest(`http://localhost:3000/api/purchases/transactions?page=1&${query}`));
      await GET(new NextRequest(`http://localhost:3000/api/purchases/transactions?page=2&${query}`));

      expect(transactionQuery.countTransactionGroups).toHaveBeenCalledTimes(1);
      expect(transactionQuery.fetchPaginatedTransactionGroups).toHaveBeenCalledTimes(2);
    });

    it('passes correct page and limit to paginated group query', async () => {
      mockGroupedTransactions([], 0);
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?page=3&limit=10&startDate=2024-01-01&endDate=2024-01-31',
      );
      await GET(request);

      expect(transactionQuery.fetchPaginatedTransactionGroups).toHaveBeenCalledWith(
        expect.any(Object),
        3,
        10,
      );
    });

    it('fetches full purchase data only for the current page purchaseNos', async () => {
      const pageRows = [
        {
          purchaseNo: 'PUR-PAGE',
          memberId: 'member-1',
          _max: { createdAt: new Date('2024-01-15T10:00:00'), date: new Date('2024-01-15') },
          _sum: { totalAmount: 500 },
        },
      ];

      mockGroupedTransactions(pageRows, 2);

      vi.mocked(prisma.purchase.findMany).mockResolvedValue([
        { ...mockPurchase1, purchaseNo: 'PUR-PAGE' },
      ]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?page=1&limit=1&startDate=2024-01-01&endDate=2024-01-31',
      );
      await GET(request);

      expect(prisma.purchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            purchaseNo: { in: ['PUR-PAGE'] },
          }),
        }),
      );
    });
  });

  describe('DB-level search (scalability fix)', () => {
    it('pre-fetches matching memberIds before querying transactions when search is provided', async () => {
      vi.mocked(transactionQuery.resolveSearchMemberIds).mockResolvedValue(['member-match']);
      mockGroupedTransactions([]);
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?search=สมชาย&startDate=2024-01-01&endDate=2024-01-31',
      );
      await GET(request);

      expect(transactionQuery.resolveSearchMemberIds).toHaveBeenCalledWith('สมชาย', null);
    });

    it('passes search filters into grouped transaction queries', async () => {
      vi.mocked(transactionQuery.resolveSearchMemberIds).mockResolvedValue(['member-1']);
      mockGroupedTransactions([]);
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?search=abc&startDate=2024-01-01&endDate=2024-01-31',
      );
      await GET(request);

      expect(transactionQuery.countTransactionGroups).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: 'abc',
          searchMemberIds: ['member-1'],
        }),
      );
    });

    it('does not search members when memberId filter is already set', async () => {
      mockGroupedTransactions([]);
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases/transactions?memberId=member-1&search=abc&startDate=2024-01-01&endDate=2024-01-31',
      );
      await GET(request);

      expect(transactionQuery.resolveSearchMemberIds).toHaveBeenCalledWith('abc', 'member-1');
    });
  });
});

