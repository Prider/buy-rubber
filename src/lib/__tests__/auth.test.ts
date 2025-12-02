import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken, hashPassword, comparePassword, JWTPayload } from '../auth';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a JWT token with correct payload', () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'admin',
      };
      const mockToken = 'mock-jwt-token';
      vi.mocked(jwt.sign).mockReturnValue(mockToken as any);

      const token = generateToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        process.env.JWT_SECRET || 'your-secret-key-change-this',
        { expiresIn: '7d' }
      );
    });

    it('should use default JWT_SECRET when env var is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'admin',
      };
      const mockToken = 'mock-jwt-token';
      vi.mocked(jwt.sign).mockReturnValue(mockToken as any);

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'your-secret-key-change-this',
        { expiresIn: '7d' }
      );

      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      }
    });

    it('should use JWT_SECRET from env var or default', () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'user',
      };
      const mockToken = 'mock-jwt-token';
      vi.mocked(jwt.sign).mockReturnValue(mockToken as any);

      generateToken(payload);

      // The function uses process.env.JWT_SECRET || 'your-secret-key-change-this'
      // Since env vars are read at module load time, we just verify it's called with a string
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should return payload when token is valid', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'admin',
      };
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);

      const result = verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        process.env.JWT_SECRET || 'your-secret-key-change-this'
      );
    });

    it('should return null when token is invalid', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when token verification throws any error', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = verifyToken('expired-token');

      expect(result).toBeNull();
    });

    it('should use JWT_SECRET from env var or default', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'admin',
      };
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);

      verifyToken('valid-token');

      // The function uses process.env.JWT_SECRET || 'your-secret-key-change-this'
      // Since env vars are read at module load time, we just verify it's called with a string
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(String)
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashed-password';
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should handle different passwords', async () => {
      const password1 = 'password1';
      const password2 = 'password2';
      const hashed1 = 'hash1';
      const hashed2 = 'hash2';
      vi.mocked(bcrypt.hash)
        .mockResolvedValueOnce(hashed1 as never)
        .mockResolvedValueOnce(hashed2 as never);

      const result1 = await hashPassword(password1);
      const result2 = await hashPassword(password2);

      expect(result1).toBe(hashed1);
      expect(result2).toBe(hashed2);
      expect(bcrypt.hash).toHaveBeenCalledTimes(2);
    });
  });

  describe('comparePassword', () => {
    it('should return true when password matches hash', async () => {
      const password = 'testpassword123';
      const hash = 'hashed-password';
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'testpassword123';
      const hash = 'hashed-password';
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await comparePassword(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should handle different password and hash combinations', async () => {
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);

      const result1 = await comparePassword('password1', 'hash1');
      const result2 = await comparePassword('password2', 'hash2');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledTimes(2);
    });
  });
});

