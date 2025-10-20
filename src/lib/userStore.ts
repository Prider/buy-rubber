import { User, CreateUserRequest, UpdateUserRequest, UserRole } from '@/types/user';

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

// In-memory user store (replace with database later)
class UserStore {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  constructor() {
    // Initialize with default users synchronously
    this.createDefaultUsersSync();
    console.log('UserStore initialized with', this.users.size, 'users');
  }

  private createDefaultUsersSync() {
    const defaultAdmin: CreateUserRequest = {
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    };

    const defaultEmployee: CreateUserRequest = {
      username: 'employee',
      password: 'employee123',
      role: 'employee'
    };

    this.createUserSync(defaultAdmin);
    this.createUserSync(defaultEmployee);
    console.log('Default users created:', Array.from(this.users.values()).map(u => u.username));
  }

  private createUserSync(userData: CreateUserRequest): User {
    // Check if username already exists
    for (const user of this.users.values()) {
      if (user.username === userData.username) {
        throw new Error('Username already exists');
      }
    }

    const hashedPassword = simpleHash(userData.password);
    
    const user: User = {
      id: this.nextId.toString(),
      username: userData.username,
      password: hashedPassword,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.users.set(user.id, user);
    this.nextId++;
    
    console.log('Created user:', { username: user.username, role: user.role, passwordHash: user.password });
    return user;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    // Check if username already exists
    for (const user of this.users.values()) {
      if (user.username === userData.username) {
        throw new Error('Username already exists');
      }
    }

    const hashedPassword = simpleHash(userData.password);
    
    const user: User = {
      id: this.nextId.toString(),
      username: userData.username,
      password: hashedPassword,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.users.set(user.id, user);
    this.nextId++;
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    // Check if username is being changed and already exists
    if (updates.username && updates.username !== user.username) {
      for (const existingUser of this.users.values()) {
        if (existingUser.username === updates.username && existingUser.id !== id) {
          throw new Error('Username already exists');
        }
      }
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      password: updates.password ? simpleHash(updates.password) : user.password,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    console.log('Authenticating user:', username);
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      console.log('User not found:', username);
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
    
    return isValidPassword ? user : null;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }

    const isValidCurrentPassword = simpleHash(currentPassword) === user.password;
    if (!isValidCurrentPassword) {
      return false;
    }

    const hashedNewPassword = simpleHash(newPassword);
    user.password = hashedNewPassword;
    user.updatedAt = new Date();

    return true;
  }
}

// Singleton instance
export const userStore = new UserStore();