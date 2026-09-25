import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ASSIGNABLE_ROLES,
  isRootRole,
} from '@/platform/types/user';
import { prisma } from '@/platform/prisma';
import { hashPassword, simpleHash, verifyPassword } from '@/platform/auth';

export { simpleHash };

class UserStore {
  async createUser(tenantId: string, userData: CreateUserRequest): Promise<User> {
    if (isRootRole(userData.role)) {
      throw new Error('Cannot create root user');
    }

    if (!ASSIGNABLE_ROLES.includes(userData.role)) {
      throw new Error('Invalid role');
    }

    const existingUser = await prisma.user.findUnique({
      where: { tenantId_username: { tenantId, username: userData.username } },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        tenantId,
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        isActive: true,
      },
    });

    return user as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as User | null;
  }

  async getUserByUsername(tenantId: string, username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { tenantId_username: { tenantId, username } },
    });
    return user as User | null;
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return users as User[];
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return null;
    }

    if (isRootRole(existingUser.role)) {
      throw new Error('Cannot modify root user');
    }

    if (updates.role === 'root') {
      throw new Error('Cannot assign root role');
    }

    if (updates.role !== undefined && !ASSIGNABLE_ROLES.includes(updates.role)) {
      throw new Error('Invalid role');
    }

    if (updates.username && updates.username !== existingUser.username) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: {
          tenantId_username: {
            tenantId: existingUser.tenantId,
            username: updates.username,
          },
        },
      });

      if (userWithSameUsername && userWithSameUsername.id !== id) {
        throw new Error('Username already exists');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (updates.username !== undefined) {
      updateData.username = updates.username;
    }

    if (updates.password) {
      updateData.password = await hashPassword(updates.password);
    }

    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return user as User;
  }

  async deleteUser(id: string): Promise<'deleted' | 'deactivated' | null> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { purchases: true, sales: true } },
      },
    });

    if (!existingUser) {
      return null;
    }

    if (isRootRole(existingUser.role)) {
      throw new Error('Cannot delete root user');
    }

    const hasLinkedRecords =
      existingUser._count.purchases > 0 || existingUser._count.sales > 0;

    if (hasLinkedRecords) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return 'deactivated';
    }

    try {
      await prisma.user.delete({
        where: { id },
      });
      return 'deleted';
    } catch {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return 'deactivated';
    }
  }

  async authenticateUser(
    tenantId: string,
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { tenantId_username: { tenantId, username } },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    return isValidPassword ? (user as User) : null;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return false;
    }

    const isValidCurrentPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      return false;
    }

    await prisma.user.update({
      where: { id },
      data: {
        password: await hashPassword(newPassword),
      },
    });

    return true;
  }
}

export const userStore = new UserStore();
