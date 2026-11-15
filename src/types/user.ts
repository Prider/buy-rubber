// User types and interfaces
export type UserRole = 'root' | 'admin' | 'user' | 'viewer' | 'accountant';

/** Roles that can be assigned via the admin UI / API (root is seed-only). */
export const ASSIGNABLE_ROLES: UserRole[] = ['viewer', 'user', 'accountant', 'admin'];

export function isAdminLike(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'root';
}

/** เจ้าของ and ผู้จัดการ can correct a saved purchase. root inherits owner access. */
export function canEditPurchases(role: string | undefined | null): boolean {
  return role === 'user' || isAdminLike(role);
}

/** เจ้าของ and ผู้จัดการ can delete a saved purchase. root inherits owner access. */
export function canDeletePurchases(role: string | undefined | null): boolean {
  return role === 'user' || isAdminLike(role);
}

/** Stock and sales กำไร/ขาดทุน are visible to เจ้าของ and root only. */
export function canSeeProfitLoss(role: string | undefined | null): boolean {
  return isAdminLike(role);
}

/** เจ้าของ, ผู้ดูแล, and ผู้จัดการ can open ตั้งค่าระบบ. */
export function canAccessAdminPage(role: string | undefined | null): boolean {
  return role === 'user' || isAdminLike(role);
}

/** Tabs a ผู้จัดการ must not see on ตั้งค่าระบบ. */
const MANAGER_HIDDEN_ADMIN_TABS = ['users', 'activity', 'assistant'] as const;

export function canSeeAdminTab(role: string | undefined | null, tab: string): boolean {
  if (role !== 'user') return true;
  return !MANAGER_HIDDEN_ADMIN_TABS.some((hidden) => hidden === tab);
}

export function isRootRole(role: string | undefined | null): boolean {
  return role === 'root';
}

export function isAccountantRole(role: string | undefined | null): boolean {
  return role === 'accountant';
}

export function isViewerRole(role: string | undefined | null): boolean {
  return role === 'viewer';
}

/** Pages a พนักงาน (viewer) account must not open. */
const VIEWER_HIDDEN_PREFIXES = ['/dashboard', '/stock', '/reports', '/sales', '/destination-companies', '/expenses'] as const;

/** Pages a ผู้จัดการ (user) account must not open. */
const MANAGER_HIDDEN_PREFIXES = ['/dashboard', '/reports'] as const;

function pathMatches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Landing page after login. Accountant opens reports; พนักงาน and ผู้จัดการ open purchases. */
export function homePathForRole(role: string | undefined | null): string {
  if (isAccountantRole(role)) return '/reports';
  if (isViewerRole(role) || role === 'user') return '/purchases';
  return '/dashboard';
}

export function canAccessAppPath(role: string | undefined | null, pathname: string): boolean {
  if (isAccountantRole(role)) {
    return pathMatches(pathname, '/reports');
  }
  if (isViewerRole(role)) {
    return !VIEWER_HIDDEN_PREFIXES.some((prefix) => pathMatches(pathname, prefix));
  }
  if (role === 'user') {
    return !MANAGER_HIDDEN_PREFIXES.some((prefix) => pathMatches(pathname, prefix));
  }
  return true;
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
    'prices.read',
    'prices.update',
    'locations.read',
    'locations.update',
  ],
  viewer: [
    'prices.read',
    'locations.read',
  ],
  accountant: [
    'reports.read'
  ]
};
