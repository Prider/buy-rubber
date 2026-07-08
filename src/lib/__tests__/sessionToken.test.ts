import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  clearAuthSession,
  decodeTokenPayload,
  isTokenExpired,
  redirectToLogin,
} from '../sessionToken';

const JWT_SECRET = 'your-secret-key-change-this';

function createJwt(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('sessionToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('decodeTokenPayload', () => {
    it('should decode a valid JWT payload', () => {
      const token = createJwt({
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      });

      const payload = decodeTokenPayload(token);

      expect(payload).toMatchObject({
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      });
      expect(payload?.exp).toBeTypeOf('number');
    });

    it('should return null for malformed tokens', () => {
      expect(decodeTokenPayload('not-a-token')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for a valid unexpired token', () => {
      const token = createJwt({
        userId: 'user-1',
        username: 'admin',
        role: 'admin',
      });

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for an expired token', () => {
      const token = jwt.sign(
        {
          userId: 'user-1',
          username: 'admin',
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should treat legacy base64 tokens as expired', () => {
      const legacy = Buffer.from(
        JSON.stringify({ userId: 'user-1', username: 'admin', role: 'admin' })
      ).toString('base64');

      expect(isTokenExpired(legacy)).toBe(true);
    });
  });

  describe('clearAuthSession', () => {
    it('should remove auth keys from localStorage', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('auth_user', '{"id":"1"}');

      clearAuthSession();

      expect(localStorage.getItem('auth_token')).toBeFalsy();
      expect(localStorage.getItem('auth_user')).toBeFalsy();
    });
  });

  describe('redirectToLogin', () => {
    it('should clear session and navigate to login', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('auth_user', '{"id":"1"}');

      const originalLocation = window.location;
      const hrefSetter = vi.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, set href(value: string) { hrefSetter(value); } },
      });

      redirectToLogin();

      expect(localStorage.getItem('auth_token')).toBeFalsy();
      expect(hrefSetter).toHaveBeenCalledWith('/login');

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });
  });
});
