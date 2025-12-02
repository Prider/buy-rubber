import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import type { User } from '@/types/user';

// Mock userStore - functions will be set up in beforeEach
vi.mock('@/lib/userStore', () => ({
  userStore: {
    authenticateUser: vi.fn(),
    getAllUsers: vi.fn(),
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

describe('POST /api/auth/login', () => {
  const mockUser: User = {
    id: '1',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'admin',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  };

  let userStore: any;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'file:./test.db';
    
    // Get mocked modules
    const userStoreModule = await import('@/lib/userStore');
    const loggerModule = await import('@/lib/logger');
    userStore = userStoreModule.userStore;
    logger = loggerModule.logger;
  });

  describe('Successful login', () => {
    it('should return success with user and token when credentials are valid', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(mockUser.id);
      expect(data.user.username).toBe(mockUser.username);
      expect(data.user.role).toBe(mockUser.role);
      expect(data.user.password).toBeUndefined();
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
    });

    it('should generate a valid base64 token', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.token).toBeDefined();
      
      // Decode token and verify structure
      const decoded = JSON.parse(Buffer.from(data.token, 'base64').toString());
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.role).toBe(mockUser.role);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when username is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username and password are required');
    });

    it('should return 400 when both username and password are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username and password are required');
    });
  });

  describe('Authentication errors', () => {
    it('should return 401 when credentials are invalid', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid username or password');
    });

    it('should return 401 when user does not exist', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'nonexistent',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid username or password');
    });
  });

  describe('Database errors', () => {
    it('should return 500 when getAllUsers fails', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(userStore.getAllUsers).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Database connection error');
    });

    it('should return 500 when authenticateUser throws an error', async () => {
      const authError = new Error('Authentication failed');
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockRejectedValue(authError);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authentication error');
    });
  });

  describe('General errors', () => {
    it('should return 500 when request body is invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Internal server error');
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(userStore.getAllUsers).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    });
  });

  describe('Logging', () => {
    it('should log login attempt', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'Login attempt',
        expect.objectContaining({
          username: 'testuser',
        })
      );
    });

    it('should log successful login', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        'Login successful',
        expect.objectContaining({
          userId: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        })
      );
    });

    it('should log errors', async () => {
      const error = new Error('Test error');
      vi.mocked(userStore.getAllUsers).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      await POST(request);

      expect(vi.mocked(logger.error)).toHaveBeenCalled();
    });
  });

  describe('Password security', () => {
    it('should not include password in response', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.user).toBeDefined();
      expect(data.user.password).toBeUndefined();
      expect(data.user).not.toHaveProperty('password');
    });
  });

  describe('Token generation', () => {
    it('should generate token with correct user ID and role', async () => {
      vi.mocked(userStore.getAllUsers).mockResolvedValue([mockUser]);
      vi.mocked(userStore.authenticateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const tokenPayload = JSON.parse(
        Buffer.from(data.token, 'base64').toString()
      );

      expect(tokenPayload.userId).toBe(mockUser.id);
      expect(tokenPayload.role).toBe(mockUser.role);
    });

    it('should generate different tokens for different users', async () => {
      const user1: User = {
        ...mockUser,
        id: '1',
        username: 'user1',
        role: 'admin',
      };
      const user2: User = {
        ...mockUser,
        id: '2',
        username: 'user2',
        role: 'user',
      };

      vi.mocked(userStore.getAllUsers).mockResolvedValue([user1, user2]);
      
      vi.mocked(userStore.authenticateUser).mockResolvedValueOnce(user1);
      const request1 = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'user1',
          password: 'password123',
        }),
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();

      vi.mocked(userStore.authenticateUser).mockResolvedValueOnce(user2);
      const request2 = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: 'user2',
          password: 'password123',
        }),
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      const token1Payload = JSON.parse(
        Buffer.from(data1.token, 'base64').toString()
      );
      const token2Payload = JSON.parse(
        Buffer.from(data2.token, 'base64').toString()
      );

      expect(token1Payload.userId).toBe('1');
      expect(token2Payload.userId).toBe('2');
      expect(token1Payload.userId).not.toBe(token2Payload.userId);
    });
  });
});
