import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/sessionToken', () => ({
  getBearerToken: vi.fn(),
  getVerifiedUserFromToken: vi.fn(),
}));

import { PUT } from '../route';
import { prisma } from '@/lib/prisma';
import { getBearerToken, getVerifiedUserFromToken } from '@/lib/sessionToken';

describe('PUT /api/purchases/[id] authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a request without a signed-in user', async () => {
    vi.mocked(getBearerToken).mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1', {
      method: 'PUT',
      body: JSON.stringify({ memberId: 'member-1' }),
    });
    const response = await PUT(request, { params: { id: 'purchase-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('ไม่พบข้อมูลผู้ใช้');
    expect(prisma.purchase.findUnique).not.toHaveBeenCalled();
  });

  it('rejects staff accounts', async () => {
    vi.mocked(getBearerToken).mockReturnValue('token');
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({
      userId: 'viewer-1',
      username: 'viewer',
      role: 'viewer',
    });

    const request = new NextRequest('http://localhost:3000/api/purchases/purchase-1', {
      method: 'PUT',
      body: JSON.stringify({ memberId: 'member-1' }),
    });
    const response = await PUT(request, { params: { id: 'purchase-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('เฉพาะเจ้าของและผู้จัดการเท่านั้นที่แก้ไขรายการรับซื้อได้');
    expect(prisma.purchase.findUnique).not.toHaveBeenCalled();
  });

  it('lets a manager through the role check', async () => {
    vi.mocked(getBearerToken).mockReturnValue('token');
    vi.mocked(getVerifiedUserFromToken).mockReturnValue({
      userId: 'manager-1',
      username: 'user',
      role: 'user',
    });
    vi.mocked(prisma.purchase.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/purchases/missing', {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    const response = await PUT(request, { params: { id: 'missing' } });

    expect(response.status).toBe(404);
    expect(prisma.purchase.findUnique).toHaveBeenCalledWith({
      where: { id: 'missing' },
      include: { member: true },
    });
  });
});
