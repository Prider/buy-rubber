import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';
import { prisma } from '@/lib/prisma';

// Simple hash function (replace with bcrypt in production)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Prisma-based user store
class UserStore {
  async createUser(userData: CreateUserRequest): Promise<User> {
    console.log('Creating user in Prisma:', userData.username);
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = simpleHash(userData.password);
    
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        isActive: true
      }
    });

    console.log('User created in Prisma:', user.id, user.username);
    
    return user as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user as User | null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    return user as User | null;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return users as User[];
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    console.log('Updating user in Prisma:', id, updates);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      console.log('User not found:', id);
      return null;
    }

    // Check if username is being changed and already exists
    if (updates.username && updates.username !== existingUser.username) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: { username: updates.username }
      });
      
      if (userWithSameUsername && userWithSameUsername.id !== id) {
        throw new Error('Username already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (updates.username !== undefined) {
      updateData.username = updates.username;
    }
    
    if (updates.password) {
      updateData.password = simpleHash(updates.password);
    }
    
    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }
    
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    console.log('User updated in Prisma:', user.id, user.username);
    return user as User;
  }

  async deleteUser(id: string): Promise<boolean> {
    console.log('Deleting user from Prisma:', id);
    
    try {
      await prisma.user.delete({
        where: { id }
      });
      console.log('User deleted from Prisma:', id);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    console.log('Authenticating user from Prisma:', username);
    
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      console.log('User not found in Prisma:', username);
      return null;
    }
    
    if (!user.isActive) {
      console.log('User is inactive:', username);
      return null;
    }

    const hashedPassword = simpleHash(password);
    const isValidPassword = hashedPassword === user.password;
    
    console.log('Password check:', {
      username,
      providedPasswordHash: hashedPassword,
      storedPasswordHash: user.password,
      isValid: isValidPassword
    });
    
    return isValidPassword ? (user as User) : null;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return false;
    }

    const isValidCurrentPassword = simpleHash(currentPassword) === user.password;
    if (!isValidCurrentPassword) {
      return false;
    }

    const hashedNewPassword = simpleHash(newPassword);
    
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword
      }
    });

    return true;
  }
}

// Singleton instance
export const userStore = new UserStore();
