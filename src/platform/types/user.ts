export type UserRole = 'root' | 'admin' | 'user' | 'viewer';

export const TENANT_PLANS = ['freemium', 'premium'] as const;
export type TenantPlan = (typeof TENANT_PLANS)[number];

export const TENANT_STATUSES = ['active', 'not_yet_payment', 'pending_payment', 'rejected'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

/** Roles that can be assigned via the admin UI / API (root is seed-only). */
export const ASSIGNABLE_ROLES: UserRole[] = ['viewer', 'user', 'admin'];

export function isAdminLike(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'root';
}

export function isRootRole(role: string | undefined | null): boolean {
  return role === 'root';
}

export interface User {
  id: string;
  tenantId: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tenantSlug?: string;
  plan?: TenantPlan;
  tenantStatus?: TenantStatus;
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
  slug: string;
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
  login: (slug: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

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
  'admin.settings',
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
  ],
  viewer: ['dashboard.read', 'prices.read', 'locations.read'],
};
