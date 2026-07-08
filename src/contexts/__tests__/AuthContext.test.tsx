import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth, usePermission } from '../AuthContext';
import React from 'react';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

function createTestToken(
  payload: { userId: string; username?: string; role: string },
  expiresIn: string | number = '1h'
): string {
  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username ?? 'testuser',
      role: payload.role,
    },
    JWT_SECRET,
    { expiresIn }
  );
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Use real Buffer for token encoding/decoding
// Buffer is available in Node.js test environment
// No need to mock it - the real Buffer works fine

// Test component that uses the hook
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, hasRole, hasAnyRole } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="userRole">{user?.role || 'none'}</div>
      <button
        data-testid="login-button"
        onClick={async () => {
          await login('testuser', 'password');
        }}
      >
        Login
      </button>
      <button
        data-testid="logout-button"
        onClick={async () => {
          await logout();
        }}
      >
        Logout
      </button>
      <div data-testid="hasAdminRole">{hasRole('admin').toString()}</div>
      <div data-testid="hasAnyRole">{hasAnyRole(['admin', 'user']).toString()}</div>
    </div>
  );
}

// Test component for usePermission
function PermissionTestComponent({ permission }: { permission: string }) {
  const hasPermission = usePermission(permission as any);
  return <div data-testid="hasPermission">{hasPermission.toString()}</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('AuthProvider', () => {
    it('should initialize with no user when no token exists', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should load user from valid token in localStorage', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'testuser',
        role: 'admin',
      });
      localStorageMock.setItem('auth_token', token);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin');
    });

    it('should remove invalid token from localStorage', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem('auth_token', 'not-valid-base64-json-token!!!');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      consoleErrorSpy.mockRestore();
    });

    it('should clear expired token and redirect to login', async () => {
      const token = createTestToken(
        { userId: 'user-1', username: 'testuser', role: 'admin' },
        '-1s'
      );
      localStorageMock.setItem('auth_token', token);
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'user-1',
        username: 'testuser',
        role: 'admin',
      }));

      const hrefSetter = vi.fn();
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, set href(value: string) { hrefSetter(value); } },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(hrefSetter).toHaveBeenCalledWith('/login');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('should handle missing username in token gracefully', async () => {
      const token = jwt.sign(
        { userId: 'user-1', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      localStorageMock.setItem('auth_token', token);      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Unknown');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          user: mockUser,
          token: createTestToken({
            userId: 'user-1',
            username: 'testuser',
            role: 'admin',
          }),
        }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByTestId('login-button');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'testuser', password: 'password' }),
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', expect.any(String));
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should return false when login fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          message: 'Invalid credentials',
        }),
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByTestId('login-button');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors during login', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByTestId('login-button');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout and clear user data', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'testuser',
        role: 'admin',
      });
      localStorageMock.setItem('auth_token', token);
      (global.fetch as any).mockResolvedValueOnce({});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const logoutButton = screen.getByTestId('logout-button');
      logoutButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should handle logout API errors gracefully', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'testuser',
        role: 'admin',
      });
      localStorageMock.setItem('auth_token', token);
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const logoutButton = screen.getByTestId('logout-button');
      logoutButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      // Should still clear user even if API call fails
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      });
      localStorageMock.setItem('auth_token', token);
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('hasAdminRole')).toHaveTextContent('true');
    });

    it('should return false when user does not have the role', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'user',
        role: 'user',
      });
      localStorageMock.setItem('auth_token', token);
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('hasAdminRole')).toHaveTextContent('false');
    });

    it('should return false when no user is logged in', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('hasAdminRole')).toHaveTextContent('false');
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the roles', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      });
      localStorageMock.setItem('auth_token', token);
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('hasAnyRole')).toHaveTextContent('true');
    });

    it('should return false when user does not have any of the roles', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'viewer',
        role: 'viewer',
      });
      localStorageMock.setItem('auth_token', token);
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('hasAnyRole')).toHaveTextContent('false');
    });
  });

  describe('useAuth', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('usePermission', () => {
    it('should return true when user has the permission', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      });
      localStorageMock.setItem('auth_token', token);
      render(
        <AuthProvider>
          <PermissionTestComponent permission="user.create" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('hasPermission')).toHaveTextContent('true');
      });
    });

    it('should return false when user does not have the permission', async () => {
      const token = createTestToken({
        userId: 'user-1',
        username: 'viewer',
        role: 'viewer',
      });
      localStorageMock.setItem('auth_token', token);
      render(
        <AuthProvider>
          <PermissionTestComponent permission="user.create" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('hasPermission')).toHaveTextContent('false');
      });
    });

    it('should return false when no user is logged in', async () => {
      render(
        <AuthProvider>
          <PermissionTestComponent permission="user.create" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('hasPermission')).toHaveTextContent('false');
      });
    });
  });
});

