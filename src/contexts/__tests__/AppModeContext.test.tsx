import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AppModeProvider, useAppMode } from '../AppModeContext';
import { DEFAULT_SERVER_CONFIG, CONFIG_KEYS } from '@/lib/config';
import React from 'react';

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

// Test component that uses the hook
function TestComponent() {
  const { config, isServerMode, isClientMode, updateConfig, switchMode, loading } = useAppMode();
  
  return (
    <div>
      <div data-testid="mode">{config.mode}</div>
      <div data-testid="isServerMode">{isServerMode.toString()}</div>
      <div data-testid="isClientMode">{isClientMode.toString()}</div>
      <div data-testid="serverPort">{config.serverPort}</div>
      <div data-testid="clientPort">{config.clientPort}</div>
      <div data-testid="serverUrl">{config.serverUrl || 'none'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <button
        data-testid="update-config"
        onClick={() => updateConfig({ serverPort: 4000 })}
      >
        Update Config
      </button>
      <button
        data-testid="switch-to-client"
        onClick={() => switchMode('client', 'http://example.com')}
      >
        Switch to Client
      </button>
      <button
        data-testid="switch-to-server"
        onClick={() => switchMode('server')}
      >
        Switch to Server
      </button>
    </div>
  );
}

describe('AppModeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('AppModeProvider', () => {
    it('should provide default config when no localStorage values exist', async () => {
      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      // Wait for loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('server');
      expect(screen.getByTestId('isServerMode')).toHaveTextContent('true');
      expect(screen.getByTestId('isClientMode')).toHaveTextContent('false');
      expect(screen.getByTestId('serverPort')).toHaveTextContent(DEFAULT_SERVER_CONFIG.port.toString());
      expect(screen.getByTestId('clientPort')).toHaveTextContent('3000');
    });

    it('should load config from localStorage', async () => {
      localStorageMock.setItem(CONFIG_KEYS.APP_MODE, 'client');
      localStorageMock.setItem(CONFIG_KEYS.SERVER_URL, 'http://test.com');
      localStorageMock.setItem(CONFIG_KEYS.SERVER_PORT, '4000');
      localStorageMock.setItem(CONFIG_KEYS.CLIENT_PORT, '5000');

      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('client');
      expect(screen.getByTestId('serverUrl')).toHaveTextContent('http://test.com');
      expect(screen.getByTestId('serverPort')).toHaveTextContent('4000');
      expect(screen.getByTestId('clientPort')).toHaveTextContent('5000');
    });

    it('should use default values when localStorage has invalid port values', async () => {
      localStorageMock.setItem(CONFIG_KEYS.APP_MODE, 'server');
      localStorageMock.setItem(CONFIG_KEYS.SERVER_PORT, 'invalid');
      localStorageMock.setItem(CONFIG_KEYS.CLIENT_PORT, 'invalid');

      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('serverPort')).toHaveTextContent(DEFAULT_SERVER_CONFIG.port.toString());
      expect(screen.getByTestId('clientPort')).toHaveTextContent('3000');
    });

    it('should update config and save to localStorage', async () => {
      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const updateButton = screen.getByTestId('update-config');
      await act(async () => {
        updateButton.click();
      });

      expect(screen.getByTestId('serverPort')).toHaveTextContent('4000');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(CONFIG_KEYS.SERVER_PORT, '4000');
    });

    it('should switch to client mode with serverUrl', async () => {
      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const switchButton = screen.getByTestId('switch-to-client');
      await act(async () => {
        switchButton.click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('client');
      expect(screen.getByTestId('isServerMode')).toHaveTextContent('false');
      expect(screen.getByTestId('isClientMode')).toHaveTextContent('true');
      expect(screen.getByTestId('serverUrl')).toHaveTextContent('http://example.com');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(CONFIG_KEYS.APP_MODE, 'client');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(CONFIG_KEYS.SERVER_URL, 'http://example.com');
    });

    it('should switch to server mode', async () => {
      localStorageMock.setItem(CONFIG_KEYS.APP_MODE, 'client');
      localStorageMock.setItem(CONFIG_KEYS.SERVER_URL, 'http://test.com');

      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const switchButton = screen.getByTestId('switch-to-server');
      await act(async () => {
        switchButton.click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('server');
      expect(screen.getByTestId('isServerMode')).toHaveTextContent('true');
      expect(screen.getByTestId('isClientMode')).toHaveTextContent('false');
      expect(screen.getByTestId('serverUrl')).toHaveTextContent('none');
    });

    it('should handle localStorage errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still render with defaults
      expect(screen.getByTestId('mode')).toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage setItem errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const updateButton = screen.getByTestId('update-config');
      await act(async () => {
        updateButton.click();
      });

      // Should still update state even if localStorage fails
      expect(screen.getByTestId('serverPort')).toHaveTextContent('4000');
      consoleErrorSpy.mockRestore();
    });

    it('should set loading to false after config is loaded', async () => {
      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  describe('useAppMode', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAppMode must be used within an AppModeProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return context value when used within provider', async () => {
      await act(async () => {
        render(
          <AppModeProvider>
            <TestComponent />
          </AppModeProvider>
        );
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('mode')).toBeInTheDocument();
      expect(screen.getByTestId('isServerMode')).toBeInTheDocument();
      expect(screen.getByTestId('isClientMode')).toBeInTheDocument();
    });
  });
});

