import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APP_FONT_SIZE_STORAGE_KEY,
  applyAppFontSize,
  getStoredAppFontSize,
  normalizeAppFontSize,
} from '../appFontSize';

function useLocalStorageBackingStore() {
  const store: Record<string, string> = {};
  vi.mocked(localStorage.getItem).mockImplementation((key) => store[key] ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
    store[key] = value;
  });
  vi.mocked(localStorage.removeItem).mockImplementation((key) => {
    delete store[key];
  });
  vi.mocked(localStorage.clear).mockImplementation(() => {
    for (const key of Object.keys(store)) delete store[key];
  });
  return store;
}

describe('appFontSize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocalStorageBackingStore();
    document.documentElement.style.fontSize = '';
  });

  describe('normalizeAppFontSize', () => {
    it('accepts the four sizes', () => {
      expect(normalizeAppFontSize('sm')).toBe('sm');
      expect(normalizeAppFontSize('md')).toBe('md');
      expect(normalizeAppFontSize('lg')).toBe('lg');
      expect(normalizeAppFontSize('xl')).toBe('xl');
    });

    it('falls back to normal for unknown values', () => {
      expect(normalizeAppFontSize('huge')).toBe('md');
      expect(normalizeAppFontSize(null)).toBe('md');
      expect(normalizeAppFontSize(undefined)).toBe('md');
    });
  });

  describe('getStoredAppFontSize', () => {
    it('reads a stored size', () => {
      localStorage.setItem(APP_FONT_SIZE_STORAGE_KEY, 'lg');
      expect(getStoredAppFontSize()).toBe('lg');
    });

    it('uses normal when nothing is stored', () => {
      expect(getStoredAppFontSize()).toBe('md');
    });
  });

  describe('applyAppFontSize', () => {
    it('stores the choice and sets the root font size', () => {
      expect(applyAppFontSize('xl')).toBe('xl');
      expect(localStorage.getItem(APP_FONT_SIZE_STORAGE_KEY)).toBe('xl');
      expect(document.documentElement.style.fontSize).toBe('20px');
    });

    it('ignores unknown values and keeps the normal size', () => {
      expect(applyAppFontSize('huge')).toBe('md');
      expect(document.documentElement.style.fontSize).toBe('16px');
    });
  });
});
