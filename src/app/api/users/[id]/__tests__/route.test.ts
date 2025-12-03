import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';

// Mock userStore
vi.mock('@/lib/userStore', () => ({
  userStore: {
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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

describe('GET /api/users/[id]', () => {
  let userStore: any;

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
    userStore = userStoreModule.userStore;
  });

  describe('Authorization', () => {
    it('should return 403 when no authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-1');
      const response = await GET(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
      expect(vi.mocked(userStore.getUserById)).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      const token = createUserToken();
      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Successful retrieval', () => {
    it('should return user without password', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.getUserById).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(mockUser.id);
      expect(data.user.username).toBe(mockUser.username);
      expect(data.user.password).toBeUndefined();
      expect(vi.mocked(userStore.getUserById)).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when user does not exist', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.getUserById).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/nonexistent', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 500 when getUserById fails', async () => {
      const token = createAdminToken();
      const error = new Error('Database connection failed');
      vi.mocked(userStore.getUserById).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await GET(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Get user error:', error);
    });
  });
});

describe('PUT /api/users/[id]', () => {
  let userStore: any;

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
    userStore = userStoreModule.userStore;
  });

  describe('Authorization', () => {
    it('should return 403 when no authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
      expect(vi.mocked(userStore.updateUser)).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      const token = createUserToken();
      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Successful update', () => {
    it('should update user username', async () => {
      const token = createAdminToken();
      const updatedUser = { ...mockUser, username: 'updateduser' };
      vi.mocked(userStore.updateUser).mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.username).toBe('updateduser');
      expect(data.user.password).toBeUndefined();
      expect(vi.mocked(userStore.updateUser)).toHaveBeenCalledWith('user-1', {
        username: 'updateduser',
      });
    });

    it('should update user role', async () => {
      const token = createAdminToken();
      const updatedUser = { ...mockUser, role: 'admin' as const };
      vi.mocked(userStore.updateUser).mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: 'admin',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe('admin');
    });

    it('should update user isActive status', async () => {
      const token = createAdminToken();
      const updatedUser = { ...mockUser, isActive: false };
      vi.mocked(userStore.updateUser).mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: false,
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.isActive).toBe(false);
    });

    it('should update multiple fields', async () => {
      const token = createAdminToken();
      const updatedUser = { ...mockUser, username: 'updateduser', role: 'admin' as const };
      vi.mocked(userStore.updateUser).mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'updateduser',
          role: 'admin',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('updateduser');
      expect(data.user.role).toBe('admin');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when user does not exist', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.updateUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users/nonexistent', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });
      const response = await PUT(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 409 when username already exists', async () => {
      const token = createAdminToken();
      const error = new Error('Username already exists');
      vi.mocked(userStore.updateUser).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'existinguser',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username already exists');
    });

    it('should return 500 when updateUser fails with other error', async () => {
      const token = createAdminToken();
      const error = new Error('Database connection failed');
      vi.mocked(userStore.updateUser).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });
      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Update user error:', error);
    });
  });

  describe('Logging', () => {
    it('should log the PUT request', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.updateUser).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });
      await PUT(request, { params: { id: 'user-1' } });

      expect(consoleLogSpy).toHaveBeenCalledWith('PUT /api/users/[id] - Update user request:', 'user-1');
    });
  });
});

describe('DELETE /api/users/[id]', () => {
  let userStore: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const userStoreModule = await import('@/lib/userStore');
    userStore = userStoreModule.userStore;
  });

  describe('Authorization', () => {
    it('should return 403 when no authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
      expect(vi.mocked(userStore.deleteUser)).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      const token = createUserToken();
      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await DELETE(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Successful deletion', () => {
    it('should delete a user', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.deleteUser).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await DELETE(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('User deleted successfully');
      expect(vi.mocked(userStore.deleteUser)).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Error handling', () => {
    it('should return 404 when user does not exist', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.deleteUser).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/users/nonexistent', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });

    it('should return 500 when deleteUser fails', async () => {
      const token = createAdminToken();
      const error = new Error('Database connection failed');
      vi.mocked(userStore.deleteUser).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await DELETE(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete user error:', error);
    });
  });

  describe('Logging', () => {
    it('should log the DELETE request', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.deleteUser).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/users/user-1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      await DELETE(request, { params: { id: 'user-1' } });

      expect(consoleLogSpy).toHaveBeenCalledWith('DELETE /api/users/[id] - Delete user request:', 'user-1');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string id', async () => {
      const token = createAdminToken();
      vi.mocked(userStore.deleteUser).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/users/', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await DELETE(request, { params: { id: '' } });
      await response.json();

      expect(response.status).toBe(404);
      expect(vi.mocked(userStore.deleteUser)).toHaveBeenCalledWith('');
    });

    it('should handle UUID format id', async () => {
      const token = createAdminToken();
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      vi.mocked(userStore.deleteUser).mockResolvedValue(true);

      const request = new NextRequest(`http://localhost:3000/api/users/${uuidId}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const response = await DELETE(request, { params: { id: uuidId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(vi.mocked(userStore.deleteUser)).toHaveBeenCalledWith(uuidId);
    });
  });
});

