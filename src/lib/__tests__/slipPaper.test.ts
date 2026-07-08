import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SLIP_PAPER_SIZE_STORAGE_KEY,
  cssPxFromMm,
  slipPageWidthMm,
  slipWidthPxFor,
  normalizeSlipPaperSize,
  getStoredSlipPaperSize,
  slipPaperLabelFor,
} from '../slipPaper';

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

describe('slipPaper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocalStorageBackingStore();
  });

  describe('cssPxFromMm', () => {
    it('converts mm to CSS px at 96dpi', () => {
      expect(cssPxFromMm(80)).toBe(302);
      expect(cssPxFromMm(58)).toBe(219);
      expect(cssPxFromMm(104)).toBe(393);
    });
  });

  describe('slipPageWidthMm', () => {
    it('returns nominal width for each paper size', () => {
      expect(slipPageWidthMm('58mm')).toBe(58);
      expect(slipPageWidthMm('80mm')).toBe(80);
      expect(slipPageWidthMm('104mm')).toBe(104);
    });
  });

  describe('slipWidthPxFor', () => {
    it('returns CSS px width for each thermal paper size', () => {
      expect(slipWidthPxFor('58mm')).toBe(219);
      expect(slipWidthPxFor('80mm')).toBe(302);
      expect(slipWidthPxFor('104mm')).toBe(393);
    });
  });

  describe('normalizeSlipPaperSize', () => {
    it('accepts valid paper size ids', () => {
      expect(normalizeSlipPaperSize('58mm')).toBe('58mm');
      expect(normalizeSlipPaperSize('80mm')).toBe('80mm');
      expect(normalizeSlipPaperSize('104mm')).toBe('104mm');
    });

    it('falls back to 80mm for unknown values', () => {
      expect(normalizeSlipPaperSize('a4')).toBe('80mm');
      expect(normalizeSlipPaperSize(null)).toBe('80mm');
      expect(normalizeSlipPaperSize(undefined)).toBe('80mm');
      expect(normalizeSlipPaperSize('')).toBe('80mm');
    });
  });

  describe('getStoredSlipPaperSize', () => {
    it('reads paper size from localStorage', () => {
      localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, '58mm');
      expect(getStoredSlipPaperSize()).toBe('58mm');
    });

    it('defaults to 80mm when storage is empty', () => {
      expect(getStoredSlipPaperSize()).toBe('80mm');
    });

    it('normalizes invalid stored values', () => {
      localStorage.setItem(SLIP_PAPER_SIZE_STORAGE_KEY, 'a4');
      expect(getStoredSlipPaperSize()).toBe('80mm');
    });
  });

  describe('slipPaperLabelFor', () => {
    it('returns Thai label for each size', () => {
      expect(slipPaperLabelFor('58mm')).toContain('58mm');
      expect(slipPaperLabelFor('80mm')).toContain('80mm');
      expect(slipPaperLabelFor('104mm')).toContain('104mm');
    });
  });
});
