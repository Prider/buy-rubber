import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APP_BG_DARK_STORAGE_KEY,
  APP_BG_DARK_TONE,
  APP_BG_LIGHT_STORAGE_KEY,
  APP_BG_LIGHT_TONE,
  applyAppBgDark,
  applyAppBgLight,
  getStoredAppBgDark,
  getStoredAppBgLight,
  normalizeAppBgDark,
  normalizeAppBgLight,
} from '../appBackground';

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

describe('appBackground', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocalStorageBackingStore();
    for (const name of [
      ...Object.keys(APP_BG_LIGHT_TONE['off-white']),
      ...Object.keys(APP_BG_DARK_TONE['dark-charcoal']),
    ]) {
      document.documentElement.style.removeProperty(name);
    }
  });

  describe('normalizeAppBgLight', () => {
    it('accepts the light canvas colors', () => {
      expect(normalizeAppBgLight('off-white')).toBe('off-white');
      expect(normalizeAppBgLight('soft-cream')).toBe('soft-cream');
      expect(normalizeAppBgLight('light-gray')).toBe('light-gray');
    });

    it('falls back to off-white for unknown values', () => {
      expect(normalizeAppBgLight('hot-pink')).toBe('off-white');
      expect(normalizeAppBgLight(null)).toBe('off-white');
    });
  });

  describe('normalizeAppBgDark', () => {
    it('accepts the dark canvas colors', () => {
      expect(normalizeAppBgDark('dark-charcoal')).toBe('dark-charcoal');
      expect(normalizeAppBgDark('near-black')).toBe('near-black');
      expect(normalizeAppBgDark('warm-charcoal')).toBe('warm-charcoal');
    });

    it('falls back to dark charcoal for unknown values', () => {
      expect(normalizeAppBgDark('navy')).toBe('dark-charcoal');
      expect(normalizeAppBgDark(undefined)).toBe('dark-charcoal');
    });
  });

  describe('getStored backgrounds', () => {
    it('reads stored colors', () => {
      localStorage.setItem(APP_BG_LIGHT_STORAGE_KEY, 'soft-cream');
      localStorage.setItem(APP_BG_DARK_STORAGE_KEY, 'near-black');
      expect(getStoredAppBgLight()).toBe('soft-cream');
      expect(getStoredAppBgDark()).toBe('near-black');
    });

    it('uses the current defaults when nothing is stored', () => {
      expect(getStoredAppBgLight()).toBe('off-white');
      expect(getStoredAppBgDark()).toBe('dark-charcoal');
    });
  });

  describe('apply backgrounds', () => {
    it('stores and applies a light canvas color to component surfaces', () => {
      expect(applyAppBgLight('light-gray')).toBe('light-gray');
      expect(localStorage.getItem(APP_BG_LIGHT_STORAGE_KEY)).toBe('light-gray');
      expect(document.documentElement.style.getPropertyValue('--app-bg-light')).toBe(
        APP_BG_LIGHT_TONE['light-gray']['--app-bg-light'],
      );
      expect(document.documentElement.style.getPropertyValue('--tone-surface')).toBe(
        APP_BG_LIGHT_TONE['light-gray']['--tone-surface'],
      );
    });

    it('stores and applies a dark canvas color to component surfaces', () => {
      expect(applyAppBgDark('warm-charcoal')).toBe('warm-charcoal');
      expect(localStorage.getItem(APP_BG_DARK_STORAGE_KEY)).toBe('warm-charcoal');
      expect(document.documentElement.style.getPropertyValue('--app-bg-dark')).toBe(
        APP_BG_DARK_TONE['warm-charcoal']['--app-bg-dark'],
      );
      expect(document.documentElement.style.getPropertyValue('--tone-panel')).toBe(
        APP_BG_DARK_TONE['warm-charcoal']['--tone-panel'],
      );
    });

    it('ignores unknown values and keeps the defaults', () => {
      expect(applyAppBgLight('lime')).toBe('off-white');
      expect(applyAppBgDark('lime')).toBe('dark-charcoal');
      expect(document.documentElement.style.getPropertyValue('--tone-surface')).toBe(
        APP_BG_LIGHT_TONE['off-white']['--tone-surface'],
      );
      expect(document.documentElement.style.getPropertyValue('--tone-panel')).toBe(
        APP_BG_DARK_TONE['dark-charcoal']['--tone-panel'],
      );
    });
  });
});
