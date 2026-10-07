// User types and interfaces
export type UserRole = 'root' | 'admin' | 'user' | 'viewer' | 'accountant';

/** Roles that can be assigned via the admin UI / API (root is seed-only). */
export const ASSIGNABLE_ROLES: UserRole[] = ['viewer', 'user', 'accountant', 'admin'];

export function isAdminLike(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'root';
}

export function isRootRole(role: string | undefined | null): boolean {
  return role === 'root';
}

export function isAccountantRole(role: string | undefined | null): boolean {
  return role === 'accountant';
}

/** Landing page after login. Accountant accounts open reports only. */
export function homePathForRole(role: string | undefined | null): string {
  return isAccountantRole(role) ? '/reports' : '/dashboard';
}

export function canAccessAppPath(role: string | undefined | null, pathname: string): boolean {
  if (!isAccountantRole(role)) return true;
  return pathname === '/reports' || pathname.startsWith('/reports/');
}

export interface User {
  id: string;
  username: string;
  password: string; // This will be hashed
  role: UserRole;
  other?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  other?: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: UserRole;
  other?: string;
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
  | 'reports.read'
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
  'reports.read',
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
    'locations.update',
    'reports.read'
  ],
  viewer: [
    'dashboard.read',
    'prices.read',
    'locations.read',
    'reports.read'
  ],
  accountant: [
    'reports.read'
  ]
};
