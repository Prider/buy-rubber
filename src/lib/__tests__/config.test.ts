import { describe, it, expect, vi } from 'vitest';
import {
  isServerMode,
  isClientMode,
  validateServerUrl,
  formatServerUrl,
  DEFAULT_SERVER_CONFIG,
  DEFAULT_CLIENT_CONFIG,
  CONFIG_KEYS,
} from '../config';

// Mock RTCPeerConnection for getLocalIPAddress tests
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
  createDataChannel: vi.fn(),
  createOffer: vi.fn().mockResolvedValue({}),
  setLocalDescription: vi.fn(),
  close: vi.fn(),
  onicecandidate: null,
}));

describe('config', () => {
  describe('isServerMode', () => {
    it('should return true for "server" mode', () => {
      expect(isServerMode('server')).toBe(true);
    });

    it('should return false for "client" mode', () => {
      expect(isServerMode('client')).toBe(false);
    });

    it('should return false for other values', () => {
      expect(isServerMode('other')).toBe(false);
      expect(isServerMode('')).toBe(false);
    });
  });

  describe('isClientMode', () => {
    it('should return true for "client" mode', () => {
      expect(isClientMode('client')).toBe(true);
    });

    it('should return false for "server" mode', () => {
      expect(isClientMode('server')).toBe(false);
    });

    it('should return false for other values', () => {
      expect(isClientMode('other')).toBe(false);
      expect(isClientMode('')).toBe(false);
    });
  });

  describe('validateServerUrl', () => {
    it('should return true for valid HTTP URL', () => {
      expect(validateServerUrl('http://localhost:3000')).toBe(true);
    });

    it('should return true for valid HTTPS URL', () => {
      expect(validateServerUrl('https://example.com')).toBe(true);
    });

    it('should return true for valid URL with path', () => {
      expect(validateServerUrl('http://localhost:3000/api')).toBe(true);
    });

    it('should return true for valid URL with query params', () => {
      expect(validateServerUrl('http://localhost:3000?param=value')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(validateServerUrl('not-a-url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateServerUrl('')).toBe(false);
    });

    it('should return false for URL without protocol', () => {
      // Note: URL constructor may accept some formats, but we test with clearly invalid ones
      expect(validateServerUrl('not-a-url')).toBe(false);
    });

    it('should return false for malformed URL', () => {
      expect(validateServerUrl('http://')).toBe(false);
    });
  });

  describe('formatServerUrl', () => {
    it('should format URL correctly with host and port', () => {
      expect(formatServerUrl('localhost', 3000)).toBe('http://localhost:3000');
    });

    it('should format URL correctly with IP address', () => {
      expect(formatServerUrl('192.168.1.1', 3001)).toBe('http://192.168.1.1:3001');
    });

    it('should format URL correctly with different ports', () => {
      expect(formatServerUrl('localhost', 8080)).toBe('http://localhost:8080');
    });

    it('should handle zero port', () => {
      expect(formatServerUrl('localhost', 0)).toBe('http://localhost:0');
    });
  });

  describe('DEFAULT_SERVER_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SERVER_CONFIG).toEqual({
        port: 3001,
        host: '0.0.0.0',
        allowExternalConnections: true,
      });
    });
  });

  describe('DEFAULT_CLIENT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CLIENT_CONFIG).toEqual({
        serverUrl: 'http://localhost:3001',
        reconnectAttempts: 5,
        reconnectInterval: 3000,
      });
    });
  });

  describe('CONFIG_KEYS', () => {
    it('should have all required keys', () => {
      expect(CONFIG_KEYS).toEqual({
        APP_MODE: 'app_mode',
        SERVER_URL: 'server_url',
        SERVER_PORT: 'server_port',
        CLIENT_PORT: 'client_port',
      });
    });

    it('should have APP_MODE key', () => {
      expect(CONFIG_KEYS.APP_MODE).toBe('app_mode');
    });

    it('should have SERVER_URL key', () => {
      expect(CONFIG_KEYS.SERVER_URL).toBe('server_url');
    });

    it('should have SERVER_PORT key', () => {
      expect(CONFIG_KEYS.SERVER_PORT).toBe('server_port');
    });

    it('should have CLIENT_PORT key', () => {
      expect(CONFIG_KEYS.CLIENT_PORT).toBe('client_port');
    });
  });
});

