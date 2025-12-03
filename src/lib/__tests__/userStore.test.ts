import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userStore } from '../userStore';
import { prisma } from '../prisma';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';

// Mock prisma
vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('userStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData: CreateUserRequest = {
        username: 'testuser',
        password: 'password123',
        role: 'admin',
      };

      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await userStore.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: expect.any(String),
          role: 'admin',
          isActive: true,
        },
      });
    });

    it('should throw error when username already exists', async () => {
      const userData: CreateUserRequest = {
        username: 'existinguser',
        password: 'password123',
        role: 'admin',
      };

      const existingUser: User = {
        id: 'user-1',
        username: 'existinguser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

      await expect(userStore.createUser(userData)).rejects.toThrow('Username already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      const userData: CreateUserRequest = {
        username: 'testuser',
        password: 'password123',
        role: 'user',
      };

      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      await userStore.createUser(userData);

      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
      expect(createCall.data.password).not.toBe('password123');
      expect(createCall.data.password).toBeTruthy();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userStore.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userStore.getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when found', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userStore.getUserByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userStore.getUserByUsername('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users ordered by createdAt desc', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          username: 'user1',
          password: 'hash1',
          role: 'admin',
          isActive: true,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          username: 'user2',
          password: 'hash2',
          role: 'user',
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

      const result = await userStore.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw error when database query fails', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(prisma.user.findMany).mockRejectedValue(error);

      await expect(userStore.getAllUsers()).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: UpdateUserRequest = {
        username: 'newusername',
        role: 'user',
      };

      const updatedUser: User = {
        ...existingUser,
        username: 'newusername',
        role: 'user',
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser as any)
        .mockResolvedValueOnce(null); // No duplicate username
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await userStore.updateUser('user-1', updates);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          username: 'newusername',
          role: 'user',
        },
      });
    });

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userStore.updateUser('non-existent', { username: 'newuser' });

      expect(result).toBeNull();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error when username already exists', async () => {
      const existingUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherUser: User = {
        id: 'user-2',
        username: 'existinguser',
        password: 'hashed-password',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: UpdateUserRequest = {
        username: 'existinguser',
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(existingUser as any)
        .mockResolvedValueOnce(otherUser as any);

      await expect(userStore.updateUser('user-1', updates)).rejects.toThrow('Username already exists');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should allow updating username to same value', async () => {
      const existingUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: UpdateUserRequest = {
        username: 'testuser', // Same username
        role: 'user',
      };

      const updatedUser: User = {
        ...existingUser,
        role: 'user',
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await userStore.updateUser('user-1', updates);

      expect(result).toEqual(updatedUser);
      // Should not check for duplicate when username is same
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should hash password when updating', async () => {
      const existingUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'old-hash',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: UpdateUserRequest = {
        password: 'newpassword123',
      };

      const updatedUser: User = {
        ...existingUser,
        password: 'new-hash',
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      await userStore.updateUser('user-1', updates);

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect(updateCall.data.password).not.toBe('newpassword123');
      expect(updateCall.data.password).toBeTruthy();
    });

    it('should update isActive status', async () => {
      const existingUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updates: UpdateUserRequest = {
        isActive: false,
      };

      const updatedUser: User = {
        ...existingUser,
        isActive: false,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await userStore.updateUser('user-1', updates);

      expect(result?.isActive).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

      const result = await userStore.deleteUser('user-1');

      expect(result).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return false when deletion fails', async () => {
      vi.mocked(prisma.user.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await userStore.deleteUser('user-1');

      expect(result).toBe(false);
    });
  });

  describe('authenticateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password', // This will be compared with hashed input
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // The simpleHash function will hash 'password123' to match stored hash
      // We need to calculate what the hash would be
      const password = 'password123';
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const hashedPassword = hash.toString();

      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithHashedPassword as any);

      const result = await userStore.authenticateUser('testuser', password);

      expect(result).toEqual(userWithHashedPassword);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userStore.authenticateUser('non-existent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userStore.authenticateUser('testuser', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const password = 'password123';
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const hashedPassword = hash.toString();

      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userStore.authenticateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(prisma.user.findUnique).mockRejectedValue(error);

      await expect(userStore.authenticateUser('testuser', 'password')).rejects.toThrow('Database connection failed');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'oldpassword';
      let hash = 0;
      for (let i = 0; i < currentPassword.length; i++) {
        const char = currentPassword.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const hashedCurrentPassword = hash.toString();

      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: hashedCurrentPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser: User = {
        ...mockUser,
        password: 'new-hash',
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await userStore.changePassword('user-1', currentPassword, 'newpassword');

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: expect.any(String),
        },
      });
    });

    it('should return false when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userStore.changePassword('non-existent', 'oldpassword', 'newpassword');

      expect(result).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false when current password is incorrect', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        password: 'hashed-password',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userStore.changePassword('user-1', 'wrongpassword', 'newpassword');

      expect(result).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});

