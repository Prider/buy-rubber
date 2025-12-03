'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, UserRole, ROLE_PERMISSIONS, Permission } from '@/types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (token && savedUser) {
      try {
        // Try to restore user from saved data first (more reliable)
        const user = JSON.parse(savedUser);
        setUser(user);
      } catch (error) {
        console.error('Invalid saved user data:', error);
        // Fallback: try to decode from token
        try {
          // Use browser-compatible base64 decoding
          const decoded = JSON.parse(atob(token));
          setUser({
            id: decoded.userId,
            username: decoded.username || 'Unknown',
            role: decoded.role,
            createdAt: new Date(decoded.createdAt || Date.now()),
            updatedAt: new Date(decoded.updatedAt || Date.now()),
            isActive: decoded.isActive !== undefined ? decoded.isActive : true
          });
        } catch (tokenError) {
          console.error('Invalid token:', tokenError);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    } else if (token) {
      // Only token exists, try to decode it
      try {
        const decoded = JSON.parse(atob(token));
        setUser({
          id: decoded.userId,
          username: decoded.username || 'Unknown',
          role: decoded.role,
          createdAt: new Date(decoded.createdAt || Date.now()),
          updatedAt: new Date(decoded.updatedAt || Date.now()),
          isActive: decoded.isActive !== undefined ? decoded.isActive : true
        });
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
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
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        // Also save user data for easier restoration on reload
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

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
