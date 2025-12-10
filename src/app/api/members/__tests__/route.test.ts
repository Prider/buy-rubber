import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    member: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
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

describe('GET /api/members', () => {
  let prisma: any;
  let logger: any;

  const mockMember = {
    id: 'member-1',
    code: 'M001',
    name: 'Test Member',
    idCard: '1234567890123',
    phone: '0812345678',
    address: 'Test Address',
    bankAccount: '1234567890',
    bankName: 'Test Bank',
    ownerPercent: 100,
    tapperPercent: 0,
    tapperId: null,
    tapperName: null,
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
    it('should return all members when no filters are provided', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toBeDefined();
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members).toHaveLength(1);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(25);
    });

    it('should filter members by search term (code)', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?search=M001');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ code: expect.objectContaining({ contains: 'M001' }) }),
            ]),
          }),
        })
      );
    });

    it('should filter members by search term (name)', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?search=Test');
      await GET(request);

      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Test' }) }),
            ]),
          }),
        })
      );
    });

    it('should filter members by search term (phone)', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?search=0812345678');
      await GET(request);

      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ phone: expect.objectContaining({ contains: '0812345678' }) }),
            ]),
          }),
        })
      );
    });

    it('should filter members by active status (true)', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?active=true');
      await GET(request);

      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should filter members by active status (false)', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?active=false');
      await GET(request);

      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });

    it('should paginate members correctly', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(100);
      vi.mocked(prisma.member.findMany).mockResolvedValue(Array(20).fill(mockMember));

      const request = new NextRequest('http://localhost:3000/api/members?page=2&limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.total).toBe(100);
      expect(data.pagination.totalPages).toBe(5);
      expect(data.pagination.hasMore).toBe(true);
      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    it('should handle pagination on last page', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(100);
      vi.mocked(prisma.member.findMany).mockResolvedValue(Array(20).fill(mockMember));

      const request = new NextRequest('http://localhost:3000/api/members?page=5&limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(5);
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should use default pagination values', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(25);
    });

    it('should combine search and active filters', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?search=Test&active=true');
      await GET(request);

      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            isActive: true,
          }),
        })
      );
    });

    it('should order members by createdAt desc and code desc', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members');
      await GET(request);

      expect(vi.mocked(prisma.member.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { createdAt: 'desc' },
            { code: 'desc' },
          ],
        })
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(0);
      vi.mocked(prisma.member.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/members');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.member.count).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/members');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('GET /api/members - Failed', dbError);
    });
  });

  describe('Logging', () => {
    it('should log the GET request with parameters', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members?search=Test&active=true&page=1&limit=20');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/members',
        expect.objectContaining({
          search: 'Test',
          active: 'true',
          page: 1,
          limit: 20,
        })
      );
    });

    it('should log success with count and pagination', async () => {
      vi.mocked(prisma.member.count).mockResolvedValue(1);
      vi.mocked(prisma.member.findMany).mockResolvedValue([mockMember]);

      const request = new NextRequest('http://localhost:3000/api/members');
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/members - Success',
        expect.objectContaining({
          count: 1,
          total: 1,
          page: 1,
        })
      );
    });
  });
});

describe('POST /api/members', () => {
  let prisma: any;
  let logger: any;

  const mockMember = {
    id: 'member-1',
    code: 'M001',
    name: 'Test Member',
    idCard: '1234567890123',
    phone: '0812345678',
    address: 'Test Address',
    bankAccount: '1234567890',
    bankName: 'Test Bank',
    ownerPercent: 100,
    tapperPercent: 0,
    tapperId: null,
    tapperName: null,
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

  describe('Successful creation', () => {
    it('should create a member with all required fields', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      vi.mocked(prisma.member.create).mockResolvedValue(mockMember);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
          idCard: '1234567890123',
          phone: '0812345678',
          address: 'Test Address',
          bankAccount: '1234567890',
          bankName: 'Test Bank',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.code).toBe(mockMember.code);
      expect(data.name).toBe(mockMember.name);
      expect(vi.mocked(prisma.member.create)).toHaveBeenCalled();
    });

    it('should use default values for ownerPercent and tapperPercent', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      vi.mocked(prisma.member.create).mockResolvedValue(mockMember);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.member.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerPercent: 100,
            tapperPercent: 0,
          }),
        })
      );
    });

    it('should create a member with custom ownerPercent and tapperPercent', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      const memberWithSplit = {
        ...mockMember,
        ownerPercent: 70,
        tapperPercent: 30,
      };
      vi.mocked(prisma.member.create).mockResolvedValue(memberWithSplit);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
          ownerPercent: 70,
          tapperPercent: 30,
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.member.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerPercent: 70,
            tapperPercent: 30,
          }),
        })
      );
    });

    it('should create a member with tapper information', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      const memberWithTapper = {
        ...mockMember,
        tapperId: 'tapper-1',
        tapperName: 'Tapper Name',
      };
      vi.mocked(prisma.member.create).mockResolvedValue(memberWithTapper);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
          tapperId: 'tapper-1',
          tapperName: 'Tapper Name',
        }),
      });

      await POST(request);

      expect(vi.mocked(prisma.member.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tapperId: 'tapper-1',
            tapperName: 'Tapper Name',
          }),
        })
      );
    });

    it('should create a member with all optional fields', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      vi.mocked(prisma.member.create).mockResolvedValue(mockMember);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
          idCard: '1234567890123',
          phone: '0812345678',
          address: 'Test Address',
          bankAccount: '1234567890',
          bankName: 'Test Bank',
          ownerPercent: 100,
          tapperPercent: 0,
          tapperId: null,
          tapperName: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toBeDefined();
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when member code already exists', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(mockMember);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('รหัสสมาชิกนี้มีอยู่แล้ว');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        'POST /api/members - Duplicate code',
        { code: 'M001' }
      );
      expect(vi.mocked(prisma.member.create)).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database create fails', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.member.create).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการสร้างสมาชิก');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('POST /api/members - Failed', dbError);
    });

    it('should return 500 when findUnique fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.member.findUnique).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการสร้างสมาชิก');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log the POST request', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      vi.mocked(prisma.member.create).mockResolvedValue(mockMember);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/members - Request',
        expect.objectContaining({
          code: 'M001',
          name: 'Test Member',
        })
      );
    });

    it('should log successful member creation', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // No duplicate name
      vi.mocked(prisma.member.create).mockResolvedValue(mockMember);

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify({
          code: 'M001',
          name: 'Test Member',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/members - Success',
        expect.objectContaining({
          memberId: mockMember.id,
          code: mockMember.code,
        })
      );
    });
  });
});

