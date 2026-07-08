'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AuthContextType, User, UserRole, ROLE_PERMISSIONS, Permission } from '@/types/user';
import {
  clearAuthSession,
  decodeTokenPayload,
  isTokenExpired,
  redirectToLogin,
} from '@/lib/sessionToken';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function userFromSavedData(savedUser: string): Omit<User, 'password'> | null {
  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function userFromToken(token: string): Omit<User, 'password'> | null {
  const decoded = decodeTokenPayload(token);
  if (!decoded) {
    return null;
  }

  return {
    id: decoded.userId,
    username: decoded.username,
    role: decoded.role as UserRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthSession();
      setUser(null);
      setIsLoading(false);
      redirectToLogin();
      return;
    }

    if (savedUser) {
      const restoredUser = userFromSavedData(savedUser);
      if (restoredUser) {
        setUser(restoredUser);
        setIsLoading(false);
        return;
      }
    }

    const restoredUser = userFromToken(token);
    if (restoredUser) {
      setUser(restoredUser);
    } else {
      clearAuthSession();
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        if (isTokenExpired(data.token)) {
          console.error('Login returned an expired token');
          return false;
        }

        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      }

      console.error('Login failed:', data.message);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      redirectToLogin();
    }
  }, []);

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user?.role]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  }), [user, isLoading, login, logout, hasRole, hasAnyRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Permission hook
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role].includes(permission);
}
