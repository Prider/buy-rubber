import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, PUT } from '../route';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('DELETE /api/expenses/[id]', () => {
  let prisma: any;

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
    prisma = prismaModule.prisma;
    vi.mocked(prisma.expense.findUnique).mockResolvedValue(null);
  });

  describe('Successful deletion', () => {
    it('should delete an expense when it exists', async () => {
      vi.mocked(prisma.expense.delete).mockResolvedValue(mockExpense);

      const request = new NextRequest('http://localhost:3000/api/expenses/expense-1');
      const response = await DELETE(request, { params: { id: 'expense-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('ลบค่าใช้จ่ายเรียบร้อยแล้ว');
      expect(vi.mocked(prisma.expense.delete)).toHaveBeenCalledWith({
        where: { id: 'expense-1' },
      });
    });
  });

  describe('Error handling', () => {
    it('should return 500 when expense does not exist', async () => {
      const dbError = new Error('Record to delete does not exist');
      vi.mocked(prisma.expense.delete).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses/nonexistent');
      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบค่าใช้จ่าย');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete expense error:', dbError);
    });

    it('should return 500 when database delete fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(prisma.expense.delete).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses/expense-1');
      const response = await DELETE(request, { params: { id: 'expense-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบค่าใช้จ่าย');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete expense error:', dbError);
    });

    it('should handle foreign key constraint errors', async () => {
      const constraintError = new Error('Foreign key constraint violation');
      vi.mocked(prisma.expense.delete).mockRejectedValue(constraintError);

      const request = new NextRequest('http://localhost:3000/api/expenses/expense-1');
      const response = await DELETE(request, { params: { id: 'expense-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบค่าใช้จ่าย');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string id', async () => {
      const dbError = new Error('Invalid ID');
      vi.mocked(prisma.expense.delete).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses/');
      const response = await DELETE(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('เกิดข้อผิดพลาดในการลบค่าใช้จ่าย');
      expect(vi.mocked(prisma.expense.delete)).toHaveBeenCalledWith({
        where: { id: '' },
      });
    });

    it('should handle special characters in id', async () => {
      const dbError = new Error('Invalid ID');
      vi.mocked(prisma.expense.delete).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/expenses/special-id-123');
      const response = await DELETE(request, { params: { id: 'special-id-123' } });
      await response.json();

      expect(response.status).toBe(500);
      expect(vi.mocked(prisma.expense.delete)).toHaveBeenCalledWith({
        where: { id: 'special-id-123' },
      });
    });

    it('should handle UUID format id', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(prisma.expense.delete).mockResolvedValue(mockExpense);

      const request = new NextRequest(`http://localhost:3000/api/expenses/${uuidId}`);
      const response = await DELETE(request, { params: { id: uuidId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('ลบค่าใช้จ่ายเรียบร้อยแล้ว');
      expect(vi.mocked(prisma.expense.delete)).toHaveBeenCalledWith({
        where: { id: uuidId },
      });
    });
  });
});

describe('PUT /api/expenses/[id]', () => {
  let prisma: any;

  const existing = {
    id: 'expense-1',
    expenseNo: 'EXP-20240115-001',
    date: new Date('2024-01-15T03:30:00.000Z'),
    category: 'ค่าน้ำมัน',
    amount: 500,
    description: 'เติมน้ำมัน',
    userId: 'user-1',
    userName: 'tester',
    createdAt: new Date('2024-01-15T03:30:00.000Z'),
    updatedAt: new Date('2024-01-15T03:30:00.000Z'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma;
  });

  it('updates category, amount, description, and date', async () => {
    const updated = {
      ...existing,
      category: 'ค่าซ่อมรถ',
      amount: 750.5,
      description: 'เปลี่ยนยาง',
      date: new Date('2024-02-02T03:15:00.000Z'),
    };
    vi.mocked(prisma.expense.findUnique).mockResolvedValue(existing);
    vi.mocked(prisma.expense.update).mockResolvedValue(updated);

    const request = new NextRequest('http://localhost:3000/api/expenses/expense-1', {
      method: 'PUT',
      body: JSON.stringify({
        date: '2024-02-02T10:15',
        category: 'ค่าซ่อมรถ',
        amount: 750.5,
        description: 'เปลี่ยนยาง',
      }),
    });
    const response = await PUT(request, { params: { id: 'expense-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.category).toBe('ค่าซ่อมรถ');
    expect(data.expenseNo).toBe(existing.expenseNo);
    expect(vi.mocked(prisma.expense.update)).toHaveBeenCalledWith({
      where: { id: 'expense-1' },
      data: {
        date: new Date('2024-02-02T10:15+07:00'),
        category: 'ค่าซ่อมรถ',
        amount: 750.5,
        description: 'เปลี่ยนยาง',
      },
    });
  });

  it('returns 404 when the expense does not exist', async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/expenses/missing', {
      method: 'PUT',
      body: JSON.stringify({
        date: '2024-02-02T10:15',
        category: 'ค่าน้ำมัน',
        amount: 100,
      }),
    });
    const response = await PUT(request, { params: { id: 'missing' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('ไม่พบค่าใช้จ่าย');
    expect(vi.mocked(prisma.expense.update)).not.toHaveBeenCalled();
  });

  it('returns 400 when the amount is missing', async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue(existing);

    const request = new NextRequest('http://localhost:3000/api/expenses/expense-1', {
      method: 'PUT',
      body: JSON.stringify({
        date: '2024-02-02T10:15',
        category: 'ค่าน้ำมัน',
        amount: 0,
      }),
    });
    const response = await PUT(request, { params: { id: 'expense-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('กรุณาเลือกประเภทและกรอกจำนวนเงินที่มากกว่า 0');
  });
});

