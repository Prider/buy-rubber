import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findUnique: vi.fn(),
      delete: vi.fn(),
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

describe('DELETE /api/purchases/[id]', () => {
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
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    const loggerModule = await import('@/lib/logger');
    prisma = prismaModule.prisma;
    logger = loggerModule.logger;
  });

  describe('Successful deletion', () => {
    it('should delete a purchase when it exists', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(mockPurchase);
      vi.mocked(prisma.purchase.delete).mockResolvedValue(mockPurchase);

      const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1');
      const response = await DELETE(request, { params: { id: 'purchase-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('ลบการรับซื้อเรียบร้อยแล้ว');
      expect(vi.mocked(prisma.purchase.findUnique)).toHaveBeenCalledWith({
        where: { id: 'purchase-1' },
      });
      expect(vi.mocked(prisma.purchase.delete)).toHaveBeenCalledWith({
        where: { id: 'purchase-1' },
      });
    });

    it('should log successful deletion', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(mockPurchase);
      vi.mocked(prisma.purchase.delete).mockResolvedValue(mockPurchase);

      const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1');
      await DELETE(request, { params: { id: 'purchase-1' } });

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'DELETE /api/purchases/[id] - Success',
        { id: 'purchase-1' }
      );
    });
  });

  describe('Error handling', () => {
    it('should return 404 when purchase does not exist', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/purchases/nonexistent');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลการรับซื้อ');
      expect(vi.mocked(prisma.purchase.findUnique)).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
      });
      expect(vi.mocked(prisma.purchase.delete)).not.toHaveBeenCalled();
    });

    it('should return 500 when findUnique fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.purchase.findUnique).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1');
      const response = await DELETE(request, { params: { id: 'purchase-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบการรับซื้อ');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'DELETE /api/purchases/[id] - Failed',
        dbError
      );
    });

    it('should return 500 when delete fails', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(mockPurchase);
      const dbError = new Error('Delete operation failed');
      vi.mocked(prisma.purchase.delete).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1');
      const response = await DELETE(request, { params: { id: 'purchase-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบการรับซื้อ');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'DELETE /api/purchases/[id] - Failed',
        dbError
      );
    });

    it('should handle foreign key constraint errors', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(mockPurchase);
      const constraintError = new Error('Foreign key constraint violation');
      vi.mocked(prisma.purchase.delete).mockRejectedValue(constraintError);

      const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1');
      const response = await DELETE(request, { params: { id: 'purchase-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบการรับซื้อ');
      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string id', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/purchases/');
      const response = await DELETE(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('ไม่พบข้อมูลการรับซื้อ');
      expect(vi.mocked(prisma.purchase.findUnique)).toHaveBeenCalledWith({
        where: { id: '' },
      });
    });

    it('should handle special characters in id', async () => {
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/purchases/special-id-123');
      const response = await DELETE(request, { params: { id: 'special-id-123' } });
      await response.json();

      expect(response.status).toBe(404);
      expect(vi.mocked(prisma.purchase.findUnique)).toHaveBeenCalledWith({
        where: { id: 'special-id-123' },
      });
    });

    it('should handle UUID format id', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(prisma.purchase.findUnique).mockResolvedValue(mockPurchase);
      vi.mocked(prisma.purchase.delete).mockResolvedValue(mockPurchase);

      const request = new NextRequest(`http://localhost:3000/api/purchases/${uuidId}`);
      const response = await DELETE(request, { params: { id: uuidId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('ลบการรับซื้อเรียบร้อยแล้ว');
      expect(vi.mocked(prisma.purchase.findUnique)).toHaveBeenCalledWith({
        where: { id: uuidId },
      });
    });
  });
});

