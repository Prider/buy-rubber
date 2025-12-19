import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
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

// Mock utils
vi.mock('@/lib/utils', () => ({
  getUserFromToken: vi.fn(),
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

describe('GET /api/expenses', () => {
  let prisma: any;
  let logger: any;

  const mockExpense = {
    id: 'expense-1',
    expenseNo: 'EXP-20240115-001',
    date: new Date('2024-01-15'),
    category: 'ค่าน้ำมัน',
    amount: 500,
    description: 'Test expense',
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
    it('should return all expenses when no filters are provided', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } }) // Today
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } }); // Month

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toBeDefined();
      expect(Array.isArray(data.expenses)).toBe(true);
      expect(data.expenses).toHaveLength(1);
      expect(data.summary).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    it('should filter expenses by startDate', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?startDate=2024-01-01');
      await GET(request);

      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter expenses by endDate', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?endDate=2024-01-31');
      await GET(request);

      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should filter expenses by date range', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?startDate=2024-01-01&endDate=2024-01-31');
      await GET(request);

      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
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

    it('should filter expenses by category', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?category=ค่าน้ำมัน');
      await GET(request);

      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'ค่าน้ำมัน',
          }),
        })
      );
    });

    it('should paginate expenses correctly', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(100);
      vi.mocked(prisma.expense.findMany).mockResolvedValue(Array(20).fill(mockExpense));
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?page=2&pageSize=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.pageSize).toBe(20);
      expect(data.pagination.total).toBe(100);
      expect(data.pagination.totalPages).toBe(5);
      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    it('should use default pagination values', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.pageSize).toBe(10);
    });

    it('should limit pageSize to maximum of 50', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?pageSize=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.pageSize).toBe(50);
    });

    it('should handle invalid page number', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?page=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
    });

    it('should handle page beyond total pages', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(10);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses?page=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBeLessThanOrEqual(data.pagination.totalPages);
    });

    it('should calculate summary statistics', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 1000 }, _count: { id: 2 } }) // Today
        .mockResolvedValueOnce({ _sum: { amount: 5000 }, _count: { id: 10 } }); // Month

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.todayTotal).toBe(1000);
      expect(data.summary.todayCount).toBe(2);
      expect(data.summary.monthTotal).toBe(5000);
      expect(data.summary.monthCount).toBe(10);
      expect(data.summary.avgDaily).toBeDefined();
      expect(data.summary.avgCount).toBeDefined();
    });

    it('should handle null summary values', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(0);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: { id: 0 } }) // Today
        .mockResolvedValueOnce({ _sum: { amount: null }, _count: { id: 0 } }); // Month

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.todayTotal).toBe(0);
      expect(data.summary.todayCount).toBe(0);
      expect(data.summary.monthTotal).toBe(0);
      expect(data.summary.monthCount).toBe(0);
      expect(data.summary.avgDaily).toBe(0);
      expect(data.summary.avgCount).toBe(0);
    });

    it('should order expenses by date desc', async () => {
      vi.mocked(prisma.expense.count).mockResolvedValue(1);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } });

      const request = new NextRequest('http://localhost:3000/api/expenses');
      await GET(request);

      expect(vi.mocked(prisma.expense.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            {
              date: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.expense.count).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to get expenses', dbError);
    });
  });
});

describe('POST /api/expenses', () => {
  let prisma: any;
  let logger: any;
  let getUserFromToken: any;

  const mockExpense = {
    id: 'expense-1',
    expenseNo: 'EXP-20240115-001',
    date: new Date('2024-01-15'),
    category: 'ค่าน้ำมัน',
    amount: 500,
    description: 'Test expense',
    userId: 'user-1',
    userName: 'testuser',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    const utilsModule = await import('@/lib/utils');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
    getUserFromToken = utilsModule.getUserFromToken;
    
    // Default mock: return null (user info should be provided in request)
    vi.mocked(getUserFromToken).mockReturnValue(null);
  });

  describe('Validation errors', () => {
    it('should return 400 when category is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toBe('Category is required');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when category is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: '   ',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toBe('Category is required');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when amount is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toBe('Amount is required and must be greater than 0');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when amount is 0', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 0,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toBe('Amount is required and must be greater than 0');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when amount is invalid string', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 'invalid',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toContain('Invalid amount');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when amount is negative', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: -100,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toContain('Invalid amount');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when date is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          date: 'invalid-date',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('วันที่ไม่ถูกต้อง');
      expect(data.details).toContain('Invalid date');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Successful creation', () => {
    it('should create an expense with all required fields', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenseNo).toBe(mockExpense.expenseNo);
      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalled();
    });

    it('should create an expense with optional description', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          description: 'Test expense description',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Test expense description',
          }),
        })
      );
    });

    it('should create an expense with custom date', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          date: '2024-01-15T10:00',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: expect.any(Date),
          }),
        })
      );
    });

    it('should use current date when date is not provided', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            date: expect.any(Date),
          }),
        })
      );
    });

    it('should generate expense number based on date and count', async () => {
      // Mock the create to return an expense with the generated expense number
      vi.mocked(prisma.expense.create).mockImplementation((args: any) => {
        return Promise.resolve({
          ...mockExpense,
          expenseNo: args.data.expenseNo,
        });
      });

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          date: '2024-01-15T10:00',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalled();
      expect(data.expenseNo).toMatch(/^EXP-20240115-[A-Z0-9]{6}$/);
      // Verify the expense number format was passed to create
      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expenseNo: expect.stringMatching(/^EXP-20240115-[A-Z0-9]{6}$/),
          }),
        })
      );
    });

    it('should reject negative amount in validation', async () => {
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: -500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน');
      expect(data.details).toContain('Invalid amount');
      expect(vi.mocked(prisma.expense.create)).not.toHaveBeenCalled();
    });

    it('should trim category and description', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: '  ค่าน้ำมัน  ',
          amount: 500,
          description: '  Test description  ',
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'ค่าน้ำมัน',
            description: 'Test description',
          }),
        })
      );
    });

    it('should set description to null when not provided', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.expense.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database create fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.expense.create).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to create expense', dbError);
    });

    it('should include stack trace in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const dbError = new Error('Database connection failed');
      dbError.stack = 'Error stack trace';
      vi.mocked(prisma.expense.create).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.stack).toBeDefined();
      vi.unstubAllEnvs();
    });

    it('should return 500 when count query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.expense.create).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log the POST request', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
        'Expense POST request data',
        expect.objectContaining({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        })
      );
    });

    it('should log expense creation', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
        'Creating expense',
        expect.objectContaining({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        })
      );
    });

    it('should log successful expense creation', async () => {
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: 'ค่าน้ำมัน',
          amount: 500,
          userId: mockUser.id,
          userName: mockUser.username,
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
        'Expense created successfully',
        expect.objectContaining({
          id: mockExpense.id,
        })
      );
    });
  });
});

