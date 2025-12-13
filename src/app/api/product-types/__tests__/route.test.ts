import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    productType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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

// Mock cache
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  CACHE_KEYS: {
    PRODUCT_TYPES: 'product-types',
  },
  CACHE_TTL: {
    PRODUCT_TYPES: 1800000,
  },
}));

describe('GET /api/product-types', () => {
  let prisma: any;
  let logger: any;

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
    description: 'Test description',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
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
    it('should return all product types ordered by code', async () => {
      vi.mocked(prisma.productType.findMany).mockResolvedValue([mockProductType]);

      const request = new NextRequest('http://localhost:3000/api/product-types');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].code).toBe(mockProductType.code);
      expect(vi.mocked(prisma.productType.findMany)).toHaveBeenCalledWith({
        orderBy: { code: 'asc' },
      });
    });

    it('should return empty array when no product types exist', async () => {
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/product-types');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productType.findMany).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to load product types');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('GET /api/product-types - Failed', dbError);
    });
  });

  describe('Logging', () => {
    it('should log the GET request', async () => {
      vi.mocked(prisma.productType.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/product-types');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith('GET /api/product-types');
    });

    it('should log success with count', async () => {
      vi.mocked(prisma.productType.findMany).mockResolvedValue([mockProductType]);

      const request = new NextRequest('http://localhost:3000/api/product-types');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/product-types - Success',
        { count: 1 }
      );
    });
  });
});

describe('POST /api/product-types', () => {
  let prisma: any;
  let logger: any;

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
    description: 'Test description',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
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
    it('should return 400 when code is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Code and name are required');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        'POST /api/product-types - Missing required fields'
      );
      expect(vi.mocked(prisma.productType.create)).not.toHaveBeenCalled();
    });

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Code and name are required');
      expect(vi.mocked(prisma.productType.create)).not.toHaveBeenCalled();
    });

    it('should return 400 when both code and name are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Code and name are required');
    });

    it('should return 409 when code already exists', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'Test Product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Product type code already exists');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        'POST /api/product-types - Duplicate code',
        { code: 'PT001' }
      );
      expect(vi.mocked(prisma.productType.create)).not.toHaveBeenCalled();
    });
  });

  describe('Successful creation', () => {
    it('should create a product type with code and name', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.create).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'น้ำยางสด',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.code).toBe(mockProductType.code);
      expect(data.name).toBe(mockProductType.name);
      expect(vi.mocked(prisma.productType.create)).toHaveBeenCalledWith({
        data: {
          code: 'PT001',
          name: 'น้ำยางสด',
          description: null,
        },
      });
    });

    it('should create a product type with description', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.create).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'น้ำยางสด',
          description: 'Test description',
        }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(201);
      expect(vi.mocked(prisma.productType.create)).toHaveBeenCalledWith({
        data: {
          code: 'PT001',
          name: 'น้ำยางสด',
          description: 'Test description',
        },
      });
    });

    it('should set description to null when not provided', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.create).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'น้ำยางสด',
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.productType.create)).toHaveBeenCalledWith({
        data: {
          code: 'PT001',
          name: 'น้ำยางสด',
          description: null,
        },
      });
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database create fails', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productType.create).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'Test Product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create product type');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('POST /api/product-types - Failed', dbError);
    });

    it('should return 500 when findUnique fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productType.findUnique).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'Test Product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create product type');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log the POST request', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.create).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'Test Product',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/product-types',
        { code: 'PT001', name: 'Test Product' }
      );
    });

    it('should log successful creation', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.create).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types', {
        method: 'POST',
        body: JSON.stringify({
          code: 'PT001',
          name: 'Test Product',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/product-types - Success',
        { id: mockProductType.id, code: mockProductType.code }
      );
    });
  });
});

