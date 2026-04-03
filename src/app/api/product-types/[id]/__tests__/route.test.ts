import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    productType: {
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    purchase: { count: vi.fn() },
    sale: { count: vi.fn() },
    stockLedgerEntry: { count: vi.fn() },
    stockPosition: { findUnique: vi.fn() },
  },
}));

// Mock cache invalidation
vi.mock('@/lib/cache', () => ({
  invalidateProductTypesCache: vi.fn(),
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('PUT /api/product-types/[id]', () => {
  let prisma: any;

  const mockProductType = {
    id: 'product-1',
    code: 'PT001',
    name: 'น้ำยางสด',
    description: 'Updated description',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma;
  });

  describe('Validation errors', () => {
    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/product-types/product-1', {
        method: 'PUT',
        body: JSON.stringify({
          description: 'Test description',
        }),
      });

      const response = await PUT(request, { params: { id: 'product-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
      expect(vi.mocked(prisma.productType.update)).not.toHaveBeenCalled();
    });
  });

  describe('Successful update', () => {
    it('should update a product type with name and description', async () => {
      vi.mocked(prisma.productType.update).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'น้ำยางสด',
          description: 'Updated description',
        }),
      });

      const response = await PUT(request, { params: { id: 'product-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe(mockProductType.name);
      expect(data.description).toBe(mockProductType.description);
      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          name: 'น้ำยางสด',
          description: 'Updated description',
        },
      });
    });

    it('should update a product type with only name', async () => {
      vi.mocked(prisma.productType.update).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'น้ำยางสด',
        }),
      });

      const response = await PUT(request, { params: { id: 'product-1' } });
      await response.json();

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          name: 'น้ำยางสด',
          description: null,
        },
      });
    });

    it('should set description to null when not provided', async () => {
      vi.mocked(prisma.productType.update).mockResolvedValue(mockProductType);

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'น้ำยางสด',
        }),
      });

      await PUT(request, { params: { id: 'product-1' } });

      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          name: 'น้ำยางสด',
          description: null,
        },
      });
    });

    it('should update isActive when provided', async () => {
      vi.mocked(prisma.productType.update).mockResolvedValue({ ...mockProductType, isActive: true });

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'น้ำยางสด',
          description: '',
          isActive: true,
        }),
      });

      await PUT(request, { params: { id: 'product-1' } });

      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          name: 'น้ำยางสด',
          description: null,
          isActive: true,
        },
      });
    });
  });

  describe('Error handling', () => {
    it('should return 500 when product type does not exist', async () => {
      const dbError = new Error('Record to update does not exist');
      vi.mocked(prisma.productType.update).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Product',
        }),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update product type');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Update product type error:', dbError);
    });

    it('should return 500 when database update fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productType.update).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Product',
        }),
      });

      const response = await PUT(request, { params: { id: 'product-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update product type');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Update product type error:', dbError);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string id', async () => {
      const dbError = new Error('Invalid ID');
      vi.mocked(prisma.productType.update).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types/', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Product',
        }),
      });

      const response = await PUT(request, { params: { id: '' } });
      await response.json();

      expect(response.status).toBe(500);
      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: '' },
        data: expect.any(Object),
      });
    });

    it('should handle UUID format id', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(prisma.productType.update).mockResolvedValue(mockProductType);

      const request = new NextRequest(`http://localhost:3000/api/product-types/${uuidId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Product',
        }),
      });

      const response = await PUT(request, { params: { id: uuidId } });
      await response.json();

      expect(response.status).toBe(200);
      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: uuidId },
        data: expect.any(Object),
      });
    });
  });
});

describe('DELETE /api/product-types/[id]', () => {
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma;
  });

  describe('Successful deletion', () => {
    it('should delete a product type when nothing references it', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue({ id: 'product-1' });
      vi.mocked(prisma.purchase.count).mockResolvedValue(0);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);
      vi.mocked(prisma.stockLedgerEntry.count).mockResolvedValue(0);
      vi.mocked(prisma.stockPosition.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.delete).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1');
      const response = await DELETE(request, { params: { id: 'product-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deactivated).toBe(false);
      expect(vi.mocked(prisma.productType.delete)).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });
  });

  describe('Error handling', () => {
    it('should return 404 when product type does not exist', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product-types/nonexistent');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Product type not found');
      expect(vi.mocked(prisma.productType.delete)).not.toHaveBeenCalled();
    });

    it('should deactivate (soft) when purchases reference the product type', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue({ id: 'product-1' });
      vi.mocked(prisma.purchase.count).mockResolvedValue(2);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);
      vi.mocked(prisma.stockLedgerEntry.count).mockResolvedValue(0);
      vi.mocked(prisma.stockPosition.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.update).mockResolvedValue({
        id: 'product-1',
        code: 'PT001',
        name: 'น้ำยางสด',
        isActive: false,
      });

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1');
      const response = await DELETE(request, { params: { id: 'product-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deactivated).toBe(true);
      expect(vi.mocked(prisma.productType.update)).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { isActive: false },
      });
      expect(vi.mocked(prisma.productType.delete)).not.toHaveBeenCalled();
    });

    it('should return 500 when database delete fails', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue({ id: 'product-1' });
      vi.mocked(prisma.purchase.count).mockResolvedValue(0);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);
      vi.mocked(prisma.stockLedgerEntry.count).mockResolvedValue(0);
      vi.mocked(prisma.stockPosition.findUnique).mockResolvedValue(null);
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.productType.delete).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/product-types/product-1');
      const response = await DELETE(request, { params: { id: 'product-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete product type');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete product type error:', dbError);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string id', async () => {
      vi.mocked(prisma.productType.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/product-types/');
      const response = await DELETE(request, { params: { id: '' } });
      await response.json();

      expect(response.status).toBe(404);
      expect(vi.mocked(prisma.productType.delete)).not.toHaveBeenCalled();
    });

    it('should handle UUID format id', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(prisma.productType.findUnique).mockResolvedValue({ id: uuidId });
      vi.mocked(prisma.purchase.count).mockResolvedValue(0);
      vi.mocked(prisma.sale.count).mockResolvedValue(0);
      vi.mocked(prisma.stockLedgerEntry.count).mockResolvedValue(0);
      vi.mocked(prisma.stockPosition.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productType.delete).mockResolvedValue({});

      const request = new NextRequest(`http://localhost:3000/api/product-types/${uuidId}`);
      const response = await DELETE(request, { params: { id: uuidId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deactivated).toBe(false);
      expect(vi.mocked(prisma.productType.delete)).toHaveBeenCalledWith({
        where: { id: uuidId },
      });
    });
  });
});

