import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    serviceFee: {
      findMany: vi.fn(),
      create: vi.fn(),
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

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  generateDocumentNumber: vi.fn(async (prefix: string, date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  }),
}));

describe('GET /api/servicefees', () => {
  let prisma: any;
  let logger: any;

  const mockServiceFee = {
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

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
  });

  describe('Successful retrieval', () => {
    it('should return all service fees when no filters are provided', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest('http://localhost:3000/api/servicefees');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].serviceFeeNo).toBe(mockServiceFee.serviceFeeNo);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith({
        where: {},
        orderBy: { date: 'desc' },
      });
    });

    it('should filter service fees by startDate', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest('http://localhost:3000/api/servicefees?startDate=2024-01-01');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter service fees by endDate', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest('http://localhost:3000/api/servicefees?endDate=2024-01-31');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter service fees by date range', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest('http://localhost:3000/api/servicefees?startDate=2024-01-01&endDate=2024-01-31');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith(
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

    it('should filter service fees by purchaseNo', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest('http://localhost:3000/api/servicefees?purchaseNo=PUR-202401-0001');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            purchaseNo: 'PUR-202401-0001',
          }),
        })
      );
    });

    it('should filter service fees by category', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest('http://localhost:3000/api/servicefees?category=ค่าขนส่ง');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'ค่าขนส่ง',
          }),
        })
      );
    });

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.serviceFee.findMany).mockResolvedValue([mockServiceFee]);

      const request = new NextRequest(
        'http://localhost:3000/api/servicefees?startDate=2024-01-01&endDate=2024-01-31&purchaseNo=PUR-202401-0001&category=ค่าขนส่ง'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.serviceFee.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            purchaseNo: 'PUR-202401-0001',
            category: 'ค่าขนส่ง',
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.serviceFee.findMany).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/servicefees');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลค่าบริการ');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to get service fees', dbError);
    });
  });
});

describe('POST /api/servicefees', () => {
  let prisma: any;
  let logger: any;
  let utils: any;

  const mockServiceFee = {
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

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    const utilsModule = await import('@/lib/utils');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
    utils = utilsModule;
  });

  describe('Single service fee creation', () => {
    describe('Validation errors', () => {
      it('should return 400 when category is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            amount: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toBe('Category is required');
      });

      it('should return 400 when category is empty string', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: '   ',
            amount: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toBe('Category is required');
      });

      it('should return 400 when amount is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toBe('Amount is required and must be greater than 0');
      });

      it('should return 400 when amount is 0', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 0,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toBe('Amount is required and must be greater than 0');
      });

      it('should return 400 when amount is invalid string', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 'invalid',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toContain('Invalid amount');
      });

      it('should return 400 when amount is negative', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: -100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toContain('Invalid amount');
      });
    });

    describe('Successful creation', () => {
      it('should create a service fee with all required fields', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.serviceFee.create).mockResolvedValue(mockServiceFee);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.serviceFeeNo).toBe(mockServiceFee.serviceFeeNo);
        expect(vi.mocked(prisma.serviceFee.create)).toHaveBeenCalled();
      });

      it('should create a service fee with optional fields', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.serviceFee.create).mockResolvedValue(mockServiceFee);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 100,
            purchaseNo: 'PUR-202401-0001',
            date: '2024-01-15',
            notes: 'Test notes',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(vi.mocked(prisma.serviceFee.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              purchaseNo: 'PUR-202401-0001',
              notes: 'Test notes',
            }),
          })
        );
      });

      it('should use current date when date is not provided', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.serviceFee.create).mockResolvedValue(mockServiceFee);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 100,
          }),
        });

        await POST(request);

        expect(vi.mocked(prisma.serviceFee.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              date: expect.any(Date),
            }),
          })
        );
      });

      it('should reject negative amount in validation', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: -100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toContain('Invalid amount');
        expect(vi.mocked(prisma.serviceFee.create)).not.toHaveBeenCalled();
      });

      it('should trim category and notes', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.serviceFee.create).mockResolvedValue(mockServiceFee);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: '  ค่าขนส่ง  ',
            amount: 100,
            notes: '  Test notes  ',
          }),
        });

        await POST(request);

        expect(vi.mocked(prisma.serviceFee.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              category: 'ค่าขนส่ง',
              notes: 'Test notes',
            }),
          })
        );
      });

      it('should generate service fee number', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.serviceFee.create).mockResolvedValue(mockServiceFee);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 100,
            date: '2024-01-15',
          }),
        });

        await POST(request);

        expect(vi.mocked(utils.generateDocumentNumber)).toHaveBeenCalledWith(
          'SVC',
          expect.any(Date)
        );
      });
    });

    describe('Error handling', () => {
      it('should return 500 when database create fails', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        const dbError = new Error('Database connection failed');
        // Use mockRejectedValue but ensure it's handled
        vi.mocked(prisma.serviceFee.create).mockRejectedValue(dbError);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 100,
          }),
        });

        // Catch any unhandled rejections during the request
        const responsePromise = POST(request);
        const response = await responsePromise;
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกค่าบริการ');
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to create service fee', dbError);
      });

      it('should include stack trace in development mode', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        const dbError = new Error('Database connection failed');
        dbError.stack = 'Error stack trace';
        vi.mocked(prisma.serviceFee.create).mockRejectedValue(dbError);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            category: 'ค่าขนส่ง',
            amount: 100,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.stack).toBeDefined();
        vi.unstubAllEnvs();
      });
    });
  });

  describe('Batch service fee creation', () => {
    describe('Validation errors', () => {
      it('should return 400 when items array is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            purchaseNo: 'PUR-202401-0001',
          }),
        });

        const response = await POST(request);

        // Should fail validation for single service fee
        expect(response.status).toBe(400);
      });

      it('should return 400 when items array is empty', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        // Empty array doesn't trigger batch mode, so it validates as single service fee
        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      });

      it('should return 400 when item category is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                amount: 100,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toBe('Category is required for all items');
      });

      it('should return 400 when item amount is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toBe('Amount is required for all items');
      });

      it('should return 400 when item amount is invalid', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 'invalid',
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toContain('Invalid amount');
      });
    });

    describe('Successful batch creation', () => {
      it('should create multiple service fees', async () => {
        vi.mocked(utils.generateDocumentNumber)
          .mockResolvedValueOnce('SVC-202401-0001')
          .mockResolvedValueOnce('SVC-202401-0002');
        
        const mockServiceFee1 = { ...mockServiceFee, id: 'servicefee-1', serviceFeeNo: 'SVC-202401-0001' };
        const mockServiceFee2 = { ...mockServiceFee, id: 'servicefee-2', serviceFeeNo: 'SVC-202401-0002' };
        
        vi.mocked(prisma.$transaction).mockResolvedValue([mockServiceFee1, mockServiceFee2]);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 100,
              },
              {
                category: 'ค่าบริการ',
                amount: 50,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.serviceFees).toHaveLength(2);
        expect(vi.mocked(prisma.$transaction)).toHaveBeenCalled();
      });

      it('should link all service fees to purchaseNo when provided', async () => {
        vi.mocked(utils.generateDocumentNumber)
          .mockResolvedValueOnce('SVC-202401-0001')
          .mockResolvedValueOnce('SVC-202401-0002');
        
        const mockServiceFee1 = { ...mockServiceFee, id: 'servicefee-1' };
        const mockServiceFee2 = { ...mockServiceFee, id: 'servicefee-2' };
        
        vi.mocked(prisma.$transaction).mockResolvedValue([mockServiceFee1, mockServiceFee2]);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            purchaseNo: 'PUR-202401-0001',
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 100,
              },
              {
                category: 'ค่าบริการ',
                amount: 50,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.purchaseNo).toBe('PUR-202401-0001');
        expect(vi.mocked(prisma.$transaction)).toHaveBeenCalled();
      });

      it('should use item date when provided', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.$transaction).mockResolvedValue([mockServiceFee]);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 100,
                date: '2024-01-15',
              },
            ],
          }),
        });

        await POST(request);

        expect(vi.mocked(utils.generateDocumentNumber)).toHaveBeenCalledWith(
          'SVC',
          expect.any(Date)
        );
      });

      it('should use batch date when item date is not provided', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        vi.mocked(prisma.$transaction).mockResolvedValue([mockServiceFee]);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            date: '2024-01-15',
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 100,
              },
            ],
          }),
        });

        await POST(request);

        expect(vi.mocked(utils.generateDocumentNumber)).toHaveBeenCalledWith(
          'SVC',
          expect.any(Date)
        );
      });

      it('should reject negative amounts in batch validation', async () => {
        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: -100,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
        expect(data.details).toContain('Invalid amount');
        expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      it('should return 500 when transaction fails', async () => {
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        const dbError = new Error('Transaction failed');
        vi.mocked(prisma.$transaction).mockRejectedValue(dbError);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 100,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกค่าบริการแบบกลุ่ม');
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Batch service fee error', dbError);
      });

      it('should include stack trace in development mode', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.mocked(utils.generateDocumentNumber).mockResolvedValue('SVC-202401-0001');
        const dbError = new Error('Transaction failed');
        dbError.stack = 'Error stack trace';
        vi.mocked(prisma.$transaction).mockRejectedValue(dbError);

        const request = new NextRequest('http://localhost:3000/api/servicefees', {
          method: 'POST',
          body: JSON.stringify({
            items: [
              {
                category: 'ค่าขนส่ง',
                amount: 100,
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.stack).toBeDefined();
        vi.unstubAllEnvs();
      });
    });
  });
});

