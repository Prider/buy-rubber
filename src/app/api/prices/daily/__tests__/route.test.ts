import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    productPrice: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
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

describe('GET /api/prices/daily', () => {
  let prisma: any;
  let logger: any;

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
    isActive: true,
  };

  const mockPrice = {
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
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
  });

  describe('Successful retrieval', () => {
    it('should return prices for today when date is not provided', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockPrice]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(vi.mocked(prisma.productPrice.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lt: expect.any(Date),
            }),
          }),
          include: {
            productType: true,
          },
        })
      );
    });

    it('should return prices for specified date', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockPrice]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily?date=2024-01-15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.productPrice.findMany)).toHaveBeenCalled();
    });

    it('should include productType in response', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockPrice]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].productType).toBeDefined();
      expect(data[0].productType.code).toBe(mockProductType.code);
    });

    it('should order prices by productType name ascending', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockPrice]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily');
      await GET(request);

      expect(vi.mocked(prisma.productPrice.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            productType: {
              name: 'asc',
            },
          },
        })
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(0);
    });

    it('should set target date to start of day', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily?date=2024-01-15');
      await GET(request);

      const callArgs = vi.mocked(prisma.productPrice.findMany).mock.calls[0][0];
      const startDate = callArgs.where.date.gte;
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productPrice.findMany).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/prices/daily');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch daily prices');
      expect(data.details).toBe('Database connection failed');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('GET /api/prices/daily - Failed', dbError);
    });
  });

  describe('Logging', () => {
    it('should log the GET request with date', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily?date=2024-01-15');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/prices/daily',
        expect.objectContaining({
          date: expect.any(String),
        })
      );
    });

    it('should log success with count', async () => {
      vi.mocked(prisma.productPrice.findMany).mockResolvedValue([mockPrice]);

      const request = new NextRequest('http://localhost:3000/api/prices/daily');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/prices/daily - Success',
        { count: 1 }
      );
    });
  });
});

describe('POST /api/prices/daily', () => {
  let prisma: any;
  let logger: any;

  const mockPrice = {
    id: 'price-1',
    date: new Date('2024-01-15'),
    productTypeId: 'product-1',
    price: 50,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
  });

  describe('Validation errors', () => {
    it('should return 400 when date is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          prices: [{ productTypeId: 'product-1', price: 50 }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Date and prices array are required');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('POST /api/prices/daily - Invalid request');
      expect(vi.mocked(prisma.productPrice.deleteMany)).not.toHaveBeenCalled();
    });

    it('should return 400 when prices is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Date and prices array are required');
    });

    it('should return 400 when prices is not an array', async () => {
      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: 'not-an-array',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Date and prices array are required');
    });
  });

  describe('Successful creation', () => {
    it('should create prices for a date', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
      expect(vi.mocked(prisma.productPrice.deleteMany)).toHaveBeenCalled();
      expect(vi.mocked(prisma.productPrice.create)).toHaveBeenCalled();
    });

    it('should delete existing prices before creating new ones', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.productPrice.deleteMany)).toHaveBeenCalledWith(
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

    it('should filter out invalid prices (price <= 0)', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
            { productTypeId: 'product-2', price: 0 },
            { productTypeId: 'product-3', price: -10 },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.count).toBe(1); // Only one valid price
      expect(vi.mocked(prisma.productPrice.create)).toHaveBeenCalledTimes(1);
    });

    it('should create multiple prices', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.productPrice.create)
        .mockResolvedValueOnce({ ...mockPrice, id: 'price-1' })
        .mockResolvedValueOnce({ ...mockPrice, id: 'price-2' });

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
            { productTypeId: 'product-2', price: 60 },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.count).toBe(2);
      expect(vi.mocked(prisma.productPrice.create)).toHaveBeenCalledTimes(2);
    });

    it('should set price date to noon to avoid timezone issues', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      await POST(request);

      const createCall = vi.mocked(prisma.productPrice.create).mock.calls[0][0];
      const priceDate = createCall.data.date;
      expect(priceDate.getHours()).toBe(12);
      expect(priceDate.getMinutes()).toBe(0);
      expect(priceDate.getSeconds()).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when deleteMany fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productPrice.deleteMany).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save daily prices');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('POST /api/prices/daily - Failed', dbError);
    });

    it('should return 500 when create fails', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productPrice.create).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save daily prices');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log the POST request', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/prices/daily',
        expect.objectContaining({
          date: '2024-01-15',
          priceCount: 1,
        })
      );
    });

    it('should log deleted prices count', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 3 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
        'Deleted existing prices',
        { count: 3 }
      );
    });

    it('should log successful creation', async () => {
      vi.mocked(prisma.productPrice.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.productPrice.create).mockResolvedValue(mockPrice);

      const request = new NextRequest('http://localhost:3000/api/prices/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: '2024-01-15',
          prices: [
            { productTypeId: 'product-1', price: 50 },
          ],
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/prices/daily - Success',
        { count: 1 }
      );
    });
  });
});

