import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import type { User } from '@/types/user';

vi.mock('@/lib/userStore', () => ({
  userStore: {
    authenticateUser: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
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

describe('POST /api/auth/login', () => {
  const mockUser: User = {
    id: '1',
    tenantId: 'tenant-1',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'admin',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  };

  const mockTenant = {
    id: 'tenant-1',
    slug: 'demo',
    plan: 'premium',
    status: 'active',
  };

  let userStore: { authenticateUser: ReturnType<typeof vi.fn> };
  let prisma: { tenant: { findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    vi.clearAllMocks();
    userStore = (await import('@/lib/userStore')).userStore as never;
    prisma = (await import('@/lib/prisma')).prisma as never;
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenant as never);
  });

  it('returns token when slug, username, and password match', async () => {
    vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        slug: 'demo',
        username: 'testuser',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.password).toBeUndefined();
    expect(data.token).toEqual(expect.any(String));
    expect(userStore.authenticateUser).toHaveBeenCalledWith('tenant-1', 'testuser', 'password123');
  });

  it('requires slug', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser', password: 'password123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects unknown tenant', async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ slug: 'missing', username: 'testuser', password: 'password123' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('rejects invalid password', async () => {
    vi.mocked(userStore.authenticateUser).mockResolvedValue(null);
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ slug: 'demo', username: 'testuser', password: 'wrong' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
