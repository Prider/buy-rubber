// User types and interfaces
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  password: string; // This will be hashed
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  message?: string;
}

export interface AuthContextType {
  user: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

// Permission types
export type Permission = 
  | 'user.create'
  | 'user.read'
  | 'user.update'
  | 'user.delete'
  | 'dashboard.read'
  | 'prices.read'
  | 'prices.update'
  | 'locations.read'
  | 'locations.update'
  | 'admin.settings';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'dashboard.read',
    'prices.read',
    'prices.update',
    'locations.read',
    'locations.update',
    'admin.settings'
  ],
  employee: [
    'dashboard.read',
    'prices.read',
    'locations.read',
    'locations.update'
  ]
};
