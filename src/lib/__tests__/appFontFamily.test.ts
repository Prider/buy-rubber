import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APP_FONT_FAMILY_STACKS,
  APP_FONT_FAMILY_STORAGE_KEY,
  DEFAULT_CONTROL_FONT_STACK,
  applyAppFontFamily,
  getStoredAppFontFamily,
  normalizeAppFontFamily,
} from '../appFontFamily';

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

describe('appFontFamily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocalStorageBackingStore();
    document.documentElement.style.removeProperty('--app-font-family');
    document.documentElement.style.removeProperty('--animal-font-family');
    document.documentElement.style.removeProperty('--app-control-font-family');
  });

  describe('normalizeAppFontFamily', () => {
    it('accepts the selectable faces', () => {
      expect(normalizeAppFontFamily('system')).toBe('system');
      expect(normalizeAppFontFamily('sarabun')).toBe('sarabun');
      expect(normalizeAppFontFamily('noto')).toBe('noto');
      expect(normalizeAppFontFamily('prompt')).toBe('prompt');
      expect(normalizeAppFontFamily('kanit')).toBe('kanit');
    });

    it('falls back to the system face for unknown values', () => {
      expect(normalizeAppFontFamily('comic-sans')).toBe('system');
      expect(normalizeAppFontFamily(null)).toBe('system');
      expect(normalizeAppFontFamily(undefined)).toBe('system');
    });
  });

  describe('getStoredAppFontFamily', () => {
    it('reads a stored face', () => {
      localStorage.setItem(APP_FONT_FAMILY_STORAGE_KEY, 'prompt');
      expect(getStoredAppFontFamily()).toBe('prompt');
    });

    it('uses the system face when nothing is stored', () => {
      expect(getStoredAppFontFamily()).toBe('system');
    });
  });

  describe('applyAppFontFamily', () => {
    it('stores a named face and applies it to body and controls', () => {
      expect(applyAppFontFamily('kanit')).toBe('kanit');
      expect(localStorage.getItem(APP_FONT_FAMILY_STORAGE_KEY)).toBe('kanit');
      expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe(
        APP_FONT_FAMILY_STACKS.kanit,
      );
      expect(document.documentElement.style.getPropertyValue('--animal-font-family')).toBe(
        APP_FONT_FAMILY_STACKS.kanit,
      );
      expect(document.documentElement.style.getPropertyValue('--app-control-font-family')).toBe(
        APP_FONT_FAMILY_STACKS.kanit,
      );
    });

    it('keeps control fonts on Nunito for the default face', () => {
      expect(applyAppFontFamily('system')).toBe('system');
      expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe(
        APP_FONT_FAMILY_STACKS.system,
      );
      expect(document.documentElement.style.getPropertyValue('--animal-font-family')).toBe(
        DEFAULT_CONTROL_FONT_STACK,
      );
    });

    it('ignores unknown values and keeps the system face', () => {
      expect(applyAppFontFamily('comic-sans')).toBe('system');
      expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe(
        APP_FONT_FAMILY_STACKS.system,
      );
    });
  });
});
