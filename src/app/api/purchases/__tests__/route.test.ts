import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
    },
    productType: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    productPrice: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
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
}));

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  calculateDryWeight: vi.fn((netWeight: number, rubberPercent: number) => 
    (netWeight * rubberPercent) / 100
  ),
  calculateAdjustedPrice: vi.fn((basePrice: number) => basePrice),
  calculateSplit: vi.fn((totalAmount: number, ownerPercent: number, tapperPercent: number) => ({
    ownerAmount: (totalAmount * ownerPercent) / 100,
    tapperAmount: (totalAmount * tapperPercent) / 100,
  })),
  getUserFromToken: vi.fn(() => null),
  generateDocumentNumber: vi.fn(async (prefix: string, date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  }),
}));

describe('GET /api/purchases', () => {
  let prisma: any;
  let logger: any;

  const mockPurchase = {
    id: 'purchase-1',
    purchaseNo: 'PUR-202401-0001',
    date: new Date('2024-01-15'),
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
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    member: {
      id: 'member-1',
      code: 'M001',
      name: 'Test Member',
    },
    productType: {
      id: 'product-1',
      code: 'PT001',
      name: 'น้ำยางสด',
    },
    user: {
      id: 'user-1',
      username: 'testuser',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
  });

  describe('Successful retrieval', () => {
    it('should return all purchases when no filters are provided', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].purchaseNo).toBe(mockPurchase.purchaseNo);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith({
        where: {},
        include: {
          member: true,
          productType: true,
          user: true,
        },
        orderBy: { date: 'desc' },
        take: undefined,
      });
    });

    it('should filter purchases by startDate', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?startDate=2024-01-01');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter purchases by endDate', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?endDate=2024-01-31');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter purchases by date range', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?startDate=2024-01-01&endDate=2024-01-31');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter purchases by memberId', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?memberId=member-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            memberId: 'member-1',
          }),
        })
      );
    });

    it('should filter purchases by productTypeId', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?productTypeId=product-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productTypeId: 'product-1',
          }),
        })
      );
    });

    it('should filter purchases by isPaid (true)', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?isPaid=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPaid: true,
          }),
        })
      );
    });

    it('should filter purchases by isPaid (false)', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?isPaid=false');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPaid: false,
          }),
        })
      );
    });

    it('should limit the number of results', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases?limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest(
        'http://localhost:3000/api/purchases?startDate=2024-01-01&endDate=2024-01-31&memberId=member-1&productTypeId=product-1&isPaid=false&limit=5'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.purchase.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            memberId: 'member-1',
            productTypeId: 'product-1',
            isPaid: false,
          }),
          take: 5,
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.purchase.findMany).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลการรับซื้อ');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log the GET request', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/purchases?memberId=member-1');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/purchases',
        expect.objectContaining({
          memberId: 'member-1',
        })
      );
    });

    it('should log success with count', async () => {
      vi.mocked(prisma.purchase.findMany).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/purchases - Success',
        expect.objectContaining({
          count: 1,
        })
      );
    });
  });
});

describe('POST /api/purchases', () => {
  let prisma: any;
  let logger: any;
  let utils: any;

  const mockMember = {
    id: 'member-1',
    code: 'M001',
    name: 'Test Member',
    ownerPercent: 100,
    tapperPercent: 0,
  };

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    role: 'user',
  };

  const mockProductPrice = {
    id: 'price-1',
    date: new Date('2024-01-15'),
    productTypeId: 'product-1',
    price: 50,
  };

  const mockPurchase = {
    id: 'purchase-1',
    purchaseNo: 'PUR-202401-1234',
    date: new Date('2024-01-15'),
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
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    member: mockMember,
    productType: mockProductType,
    user: mockUser,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    const utilsModule = await import('@/lib/utils');
    const cacheModule = await import('@/lib/cache');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
    utils = utilsModule;
    
    // Mock getUserFromToken to return null by default (no auth)
    // The mock is already set up in vi.mock above, but we can override it per test
    if (utilsModule.getUserFromToken) {
      vi.mocked(utilsModule.getUserFromToken).mockReturnValue(null);
    }
    
    // Clear cache before each test
    vi.mocked(cacheModule.cache.get).mockReturnValue(null);
  });

  describe('Single purchase creation', () => {
    describe('Validation errors', () => {
      it('should return 400 when memberId is missing', async () => {
        vi.mocked(utils.getUserFromToken).mockReturnValue({ userId: 'user-1', username: 'testuser' });
        
        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            productTypeId: 'product-1',
            date: '2024-01-15',
            grossWeight: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณาเลือกสมาชิก');
        expect(data.details).toBe('memberId is required');
      });

      it('should return 400 when productTypeId is missing', async () => {
        vi.mocked(utils.getUserFromToken).mockReturnValue({ userId: 'user-1', username: 'testuser' });
        
        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            date: '2024-01-15',
            grossWeight: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณาเลือกประเภทสินค้า');
      });

      it('should return 401 when userId is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            date: '2024-01-15',
            grossWeight: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('ไม่พบข้อมูลผู้ใช้');
      });

      it('should return 400 when date is missing', async () => {
        vi.mocked(utils.getUserFromToken).mockReturnValue({ userId: 'user-1', username: 'testuser' });
        
        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            grossWeight: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณาระบุวันที่');
      });

      it('should return 400 when grossWeight is missing or invalid', async () => {
        vi.mocked(utils.getUserFromToken).mockReturnValue({ userId: 'user-1', username: 'testuser' });
        
        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            date: '2024-01-15',
            grossWeight: 0,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณาระบุน้ำหนักรวมภาชนะ');
      });

      it('should return 400 when price is missing', async () => {
        vi.mocked(utils.getUserFromToken).mockReturnValue({ userId: 'user-1', username: 'testuser' });
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            date: '2024-01-15',
            grossWeight: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณาระบุราคาต่อหน่วย');
      });
    });

    describe('Foreign key validation', () => {
      it('should return 404 when member does not exist', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(mockProductPrice);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'nonexistent',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            pricePerUnit: 50,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('ไม่พบข้อมูลสมาชิก');
      });

      it('should return 404 when productType does not exist', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(mockProductPrice);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'nonexistent',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            pricePerUnit: 50,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('ไม่พบข้อมูลประเภทสินค้า');
      });

      it('should return 404 when user does not exist', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(mockProductPrice);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'nonexistent',
            date: '2024-01-15',
            grossWeight: 100,
            pricePerUnit: 50,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('ไม่พบข้อมูลผู้ใช้');
      });
    });

    describe('Successful creation', () => {
      it('should create a purchase with all required fields', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);
        vi.mocked(utils.getUserFromToken).mockReturnValue({ userId: 'user-1', username: 'testuser' });

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            date: '2024-01-15',
            grossWeight: 100,
            containerWeight: 5,
            netWeight: 95,
            pricePerUnit: 50,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.purchaseNo).toBe(mockPurchase.purchaseNo);
        expect(vi.mocked(prisma.purchase.create)).toHaveBeenCalled();
      });

      it('should calculate net weight from gross and container weight', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            containerWeight: 5,
            pricePerUnit: 50,
          }),
        });

        await POST(request);

        expect(vi.mocked(prisma.purchase.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              netWeight: 95, // 100 - 5
            }),
          })
        );
      });

      it('should calculate dry weight when rubberPercent is provided', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            containerWeight: 5,
            netWeight: 95,
            rubberPercent: 60,
            pricePerUnit: 50,
          }),
        });

        await POST(request);

        expect(vi.mocked(utils.calculateDryWeight)).toHaveBeenCalledWith(95, 60);
      });

      it('should use product price when pricePerUnit is not provided', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(mockProductPrice);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            containerWeight: 5,
          }),
        });

        await POST(request);

        expect(vi.mocked(prisma.purchase.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              basePrice: 50, // From productPrice
            }),
          })
        );
      });

      it('should calculate split amounts correctly', async () => {
        const memberWithSplit = { ...mockMember, ownerPercent: 70, tapperPercent: 30 };
        vi.mocked(prisma.member.findUnique).mockResolvedValue(memberWithSplit);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            containerWeight: 5,
            netWeight: 100,
            pricePerUnit: 50,
          }),
        });

        await POST(request);

        expect(vi.mocked(utils.calculateSplit)).toHaveBeenCalledWith(5000, 70, 30);
      });

      it('should generate a purchase number', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            containerWeight: 5,
            pricePerUnit: 50,
          }),
        });

        await POST(request);

        expect(vi.mocked(utils.generateDocumentNumber)).toHaveBeenCalledWith(
          'PUR',
          expect.any(Date)
        );
      });
    });

    describe('Date handling', () => {
      it('should handle date string without time', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15',
            grossWeight: 100,
            pricePerUnit: 50,
          }),
        });

        await POST(request);

        expect(vi.mocked(prisma.purchase.create)).toHaveBeenCalled();
      });

      it('should handle date string with time', async () => {
        vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
        vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

        const request = new NextRequest('http://localhost:3000/api/purchases', {
          method: 'POST',
          body: JSON.stringify({
            memberId: 'member-1',
            productTypeId: 'product-1',
            userId: 'user-1',
            date: '2024-01-15T10:30:00',
            grossWeight: 100,
            pricePerUnit: 50,
          }),
        });

        await POST(request);

        expect(vi.mocked(prisma.purchase.create)).toHaveBeenCalled();
      });
    });
  });

  describe('Batch purchase creation', () => {
    it('should return 401 when userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          items: [
            {
              memberId: 'member-1',
              productTypeId: 'product-1',
              grossWeight: 100,
            },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('ไม่พบข้อมูลผู้ใช้');
    });

    it('should return 400 when items array is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          items: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ไม่มีรายการให้บันทึก');
    });

    it('should return 400 when items array is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
        }),
      });

      const response = await POST(request);

      // Should fail validation for single purchase
      expect(response.status).toBe(400);
    });

    it('should create multiple purchases with same purchaseNo', async () => {
      // Mock multiple calls for each item validation
      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
      
      const mockPurchase1 = { ...mockPurchase, id: 'purchase-1', grossWeight: 100 };
      const mockPurchase2 = { ...mockPurchase, id: 'purchase-2', grossWeight: 200 };
      vi.mocked(prisma.$transaction).mockResolvedValue([mockPurchase1, mockPurchase2]);

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          date: '2024-01-15',
          items: [
            {
              memberId: 'member-1',
              productTypeId: 'product-1',
              grossWeight: 100,
              containerWeight: 5,
              pricePerUnit: 50,
            },
            {
              memberId: 'member-1',
              productTypeId: 'product-1',
              grossWeight: 200,
              containerWeight: 10,
              pricePerUnit: 50,
            },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.purchaseNo).toBeDefined();
      expect(Array.isArray(data.purchases)).toBe(true);
      expect(data.purchases).toHaveLength(2);
      expect(data.purchases[0].purchaseNo).toBe(data.purchases[1].purchaseNo);
    });
  });

  describe('Error handling', () => {

    it('should return 500 when request body is invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกการรับซื้อ');
    });
  });

  describe('Logging', () => {
    it('should log batch purchase creation', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue([mockPurchase]);

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          items: [
            {
              memberId: 'member-1',
              productTypeId: 'product-1',
              grossWeight: 100,
              pricePerUnit: 50,
            },
          ],
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/purchases - Received',
        expect.objectContaining({
          isBatch: true,
        })
      );
    });

    it('should log successful purchase creation', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.productPrice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.purchase.create).mockResolvedValue(mockPurchase);

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          memberId: 'member-1',
          productTypeId: 'product-1',
          userId: 'user-1',
          date: '2024-01-15',
          grossWeight: 100,
          pricePerUnit: 50,
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/purchases - Success',
        expect.objectContaining({
          purchaseId: mockPurchase.id,
          purchaseNo: mockPurchase.purchaseNo,
        })
      );
    });
  });
});

