import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SLIP_FONT_SIZE_STORAGE_KEY,
  getStoredSlipFontSize,
  normalizeSlipFontSize,
  slipFontPx,
} from '../slipFont';

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

describe('slipFont', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocalStorageBackingStore();
  });

  describe('normalizeSlipFontSize', () => {
    it('accepts H4, H3, H2, and H1', () => {
      expect(normalizeSlipFontSize('h4')).toBe('h4');
      expect(normalizeSlipFontSize('h3')).toBe('h3');
      expect(normalizeSlipFontSize('h2')).toBe('h2');
      expect(normalizeSlipFontSize('h1')).toBe('h1');
    });

    it('maps older named sizes and percents onto the nearest heading', () => {
      expect(normalizeSlipFontSize('small')).toBe('h4');
      expect(normalizeSlipFontSize('normal')).toBe('h3');
      expect(normalizeSlipFontSize('large')).toBe('h2');
      expect(normalizeSlipFontSize(80)).toBe('h4');
      expect(normalizeSlipFontSize('100')).toBe('h3');
      expect(normalizeSlipFontSize(120)).toBe('h2');
    });

    it('falls back to H2 for unknown values', () => {
      expect(normalizeSlipFontSize('huge')).toBe('h2');
      expect(normalizeSlipFontSize(null)).toBe('h2');
      expect(normalizeSlipFontSize(undefined)).toBe('h2');
    });
  });

  describe('slipFontPx', () => {
    it('keeps the current sizes at H3', () => {
      expect(slipFontPx(20, 'h3')).toBe(20);
      expect(slipFontPx(11, 'h3')).toBe(11);
    });

    it('scales sizes for H1, H2, and H4', () => {
      expect(slipFontPx(20, 'h1')).toBe(32);
      expect(slipFontPx(20, 'h2')).toBe(24);
      expect(slipFontPx(20, 'h4')).toBe(16);
    });
  });

  describe('getStoredSlipFontSize', () => {
    it('reads a stored heading size', () => {
      localStorage.setItem(SLIP_FONT_SIZE_STORAGE_KEY, 'h2');
      expect(getStoredSlipFontSize()).toBe('h2');
    });

    it('uses H2 when nothing is stored', () => {
      expect(getStoredSlipFontSize()).toBe('h2');
    });
  });
});
