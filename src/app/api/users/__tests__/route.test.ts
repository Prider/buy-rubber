import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock userStore
vi.mock('@/lib/userStore', () => ({
  userStore: {
    getAllUsers: vi.fn(),
    createUser: vi.fn(),
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

// Helper function to create admin token
function createAdminToken(): string {
  const payload = { role: 'admin', username: 'admin' };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Helper function to create non-admin token
function createUserToken(): string {
  const payload = { role: 'user', username: 'user' };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

describe('GET /api/users', () => {
  let userStore: any;
  let logger: any;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const userStoreModule = await import('@/lib/userStore');
    const loggerModule = await import('@/lib/logger');
    userStore = userStoreModule.userStore;
    logger = loggerModule.logger;
  });

  describe('Authorization', () => {
    it('should return 403 when no authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('GET /api/users - Unauthorized access attempt');
      expect(vi.mocked(userStore.getAllUsers)).not.toHaveBeenCalled();
    });

    it('should return 403 when authorization header is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: 'Invalid token',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
    });

    it('should return 403 when token is not Bearer', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: 'Basic token',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should return 403 when user is not admin', async () => {
      const token = createUserToken();
      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
    });
  });

  describe('Successful retrieval', () => {
    it('should return all users without passwords', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);

      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].id).toBe(mockUser.id);
      expect(data.users[0].username).toBe(mockUser.username);
      expect(data.users[0].password).toBeUndefined();
      expect(vi.mocked(userStore.getAllUsers)).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.getAllUsers).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when getAllUsers fails', async () => {
      const token = createAdminToken();
      const error = new Error('Database connection failed');
      vi.mocked(userStore.getAllUsers).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('GET /api/users - Failed', error);
    });
  });

  describe('Logging', () => {
    it('should log the GET request', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.getAllUsers).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith('GET /api/users - Request received');
    });

    it('should log success with count', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);

      const request = new NextRequest('http://localhost:3000/api/users', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await GET(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'GET /api/users - Success',
        { count: 1 }
      );
    });
  });
});

describe('POST /api/users', () => {
  let userStore: any;
  let logger: any;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'user' as const,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const userStoreModule = await import('@/lib/userStore');
    const loggerModule = await import('@/lib/logger');
    userStore = userStoreModule.userStore;
    logger = loggerModule.logger;
  });

  describe('Authorization', () => {
    it('should return 403 when no authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('POST /api/users - Unauthorized access attempt');
    });

    it('should return 403 when user is not admin', async () => {
      const token = createUserToken();
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when username is missing', async () => {
      const token = createAdminToken();
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: 'password',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username, password, and role are required');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('POST /api/users - Missing required fields');
      expect(vi.mocked(userStore.createUser)).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const token = createAdminToken();
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username, password, and role are required');
    });

    it('should return 400 when role is missing', async () => {
      const token = createAdminToken();
      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username, password, and role are required');
    });
  });

  describe('Successful creation', () => {
    it('should create a user with all required fields', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.createUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(mockUser.id);
      expect(data.user.username).toBe(mockUser.username);
      expect(data.user.password).toBeUndefined();
      expect(vi.mocked(userStore.createUser)).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password',
        role: 'user',
      });
    });

    it('should create a user with admin role', async () => {
      const token = createAdminToken();
      const adminUser = { ...mockUser, role: 'admin' as const };
      vi.mocked(userStore.createUser).mockResolvedValue(adminUser);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'password',
          role: 'admin',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.role).toBe('admin');
    });
  });

  describe('Error handling', () => {
    it('should return 409 when username already exists', async () => {
      const token = createAdminToken();
      const error = new Error('Username already exists');
      vi.mocked(userStore.createUser).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'existinguser',
          password: 'password',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username already exists');
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('POST /api/users - Duplicate username');
    });

    it('should return 500 when createUser fails with other error', async () => {
      const token = createAdminToken();
      const error = new Error('Database connection failed');
      vi.mocked(userStore.createUser).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('POST /api/users - Failed', error);
    });
  });

  describe('Logging', () => {
    it('should log the POST request', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.createUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith('POST /api/users - Request received');
    });

    it('should log user creation', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.createUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'Creating user',
        { username: 'testuser', role: 'user' }
      );
    });

    it('should log successful creation', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.createUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password',
          role: 'user',
        }),
      });
      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'POST /api/users - Success',
        { userId: mockUser.id, username: mockUser.username }
      );
    });
  });
});

