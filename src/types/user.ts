// User types and interfaces
export type UserRole = 'root' | 'admin' | 'user' | 'viewer';

/** Roles that can be assigned via the admin UI / API (root is seed-only). */
export const ASSIGNABLE_ROLES: UserRole[] = ['viewer', 'user', 'admin'];

export const ROOT_USERNAME = 'root';

export function isAdminLike(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'root';
}

/** System root account — cannot be created, deleted, demoted, or deactivated in-app. */
export function isProtectedSystemUser(user: {
  role?: string | null;
  username?: string | null;
}): boolean {
  return user.role === 'root' || user.username === ROOT_USERNAME;
}

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

const ADMIN_PERMISSIONS: Permission[] = [
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
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  root: [...ADMIN_PERMISSIONS],
  admin: [...ADMIN_PERMISSIONS],
  user: [
    'dashboard.read',
    'prices.read',
    'prices.update',
    'locations.read',
    'locations.update'
  ],
  viewer: [
    'dashboard.read',
    'prices.read',
    'locations.read'
  ]
};
