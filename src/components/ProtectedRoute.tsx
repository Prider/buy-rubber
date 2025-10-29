'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  fallback
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole, hasAnyRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-4 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be logged in to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need {requiredRole} role to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need one of the following roles: {requiredRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermission && !ROLE_PERMISSIONS[user.role].includes(requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function EmployeeOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function PermissionRequired({ 
  permission, 
  children, 
  fallback 
}: { 
  permission: Permission; 
  children: ReactNode; 
  fallback?: ReactNode 
}) {
  return (
    <ProtectedRoute requiredPermission={permission} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}
