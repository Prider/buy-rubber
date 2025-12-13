import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { DarkModeProvider, useDarkMode } from '../DarkModeContext';
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

// Mock window.matchMedia
const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

// Mock document.documentElement.classList
const classListMock = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
  toggle: vi.fn(),
};

Object.defineProperty(document.documentElement, 'classList', {
  writable: true,
  value: classListMock,
});

// Test component that uses the hook
function TestComponent() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <div>
      <div data-testid="isDarkMode">{isDarkMode.toString()}</div>
      <button data-testid="toggle-button" onClick={toggleDarkMode}>
        Toggle
      </button>
    </div>
  );
}

describe('DarkModeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    classListMock.add.mockClear();
    classListMock.remove.mockClear();
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('DarkModeProvider', () => {
    it('should initialize with light mode when no saved theme exists', async () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
      });

      expect(classListMock.remove).toHaveBeenCalledWith('dark');
    });

    it('should initialize with dark mode when saved theme is dark', async () => {
      localStorageMock.setItem('theme', 'dark');

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('true');
      });

      expect(classListMock.add).toHaveBeenCalledWith('dark');
    });

    it('should initialize with dark mode when system prefers dark and no saved theme', async () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('true');
      });

      expect(classListMock.add).toHaveBeenCalledWith('dark');
    });

    it('should use saved theme over system preference', async () => {
      localStorageMock.setItem('theme', 'light');
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as any);

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
      });

      expect(classListMock.remove).toHaveBeenCalledWith('dark');
    });
  });

  describe('toggleDarkMode', () => {
    it('should toggle from light to dark mode', async () => {
      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
      });

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('true');
      });

      expect(classListMock.add).toHaveBeenCalledWith('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle from dark to light mode', async () => {
      localStorageMock.setItem('theme', 'dark');

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('true');
      });

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
      });

      expect(classListMock.remove).toHaveBeenCalledWith('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should update localStorage when toggling', async () => {
      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
      });

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
    });

    it('should update document classList when toggling', async () => {
      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
      });

      const toggleButton = screen.getByTestId('toggle-button');
      toggleButton.click();

      await waitFor(() => {
        expect(classListMock.add).toHaveBeenCalledWith('dark');
      });

      // Toggle again
      toggleButton.click();

      await waitFor(() => {
        expect(classListMock.remove).toHaveBeenCalledWith('dark');
      });
    });
  });

  describe('useDarkMode', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // React errors are thrown asynchronously, so we need to catch them properly
      try {
        render(<TestComponent />);
        // If we get here, the error wasn't thrown - fail the test
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('useDarkMode must be used within a DarkModeProvider');
      }

      consoleErrorSpy.mockRestore();
    });

    it('should return context value when used within provider', async () => {
      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toBeInTheDocument();
      });

      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing localStorage gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toBeInTheDocument();
      });
    });

    it('should handle invalid theme value in localStorage', async () => {
      localStorageMock.setItem('theme', 'invalid');

      render(
        <DarkModeProvider>
          <TestComponent />
        </DarkModeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isDarkMode')).toBeInTheDocument();
      });
    });
  });
});

