/**
 * Slip / receipt paper size — shared by slip HTML, PDF capture, and admin preview.
 * Widths follow CSS 96dpi mapping from physical paper width (mm): px = round(mm × 96 / 25.4).
 */

export type SlipPaperSizeId = '58mm' | '80mm' | '104mm'; /* 'a4' */ 

export const SLIP_PAPER_SIZE_STORAGE_KEY = 'slip_paperSize';

export const SLIP_PAPER_OPTIONS: ReadonlyArray<{
  id: SlipPaperSizeId;
  label: string;
  /** Nominal physical width of the print column (mm). A4 uses full sheet width 210mm. */
  widthMm: number;
}> = [
  { id: '58mm', label: '58mm — เครื่องพิมพ์ความร้อนเล็ก', widthMm: 58 },
  { id: '80mm', label: '80mm — เครื่องพิมพ์ความร้อนมาตรฐาน', widthMm: 80 },
  { id: '104mm', label: '104mm — กระดาษกว้าง', widthMm: 104 },
  // { id: 'a4', label: 'A4 — อิงค์เจ็ต / เลเซอร์', widthMm: 210 },
];

const DEFAULT_SLIP_PAPER: SlipPaperSizeId = '80mm';

/** CSS px at 96dpi for a given width in mm. */
export function cssPxFromMm(mm: number): number {
  return Math.round((mm * 96) / 25.4);
}

export function slipPageWidthMm(id: SlipPaperSizeId): number {
  return SLIP_PAPER_OPTIONS.find((o) => o.id === id)?.widthMm ?? 80;
}

export function slipWidthPxFor(id: SlipPaperSizeId): number {
  return cssPxFromMm(slipPageWidthMm(id));
}

export function normalizeSlipPaperSize(raw: unknown): SlipPaperSizeId {
  if (raw === '58mm' || raw === '80mm' || raw === '104mm') return raw;
  return DEFAULT_SLIP_PAPER;
}

export function getStoredSlipPaperSize(): SlipPaperSizeId {
  if (typeof window === 'undefined') return DEFAULT_SLIP_PAPER;
  try {
    const v = window.localStorage.getItem(SLIP_PAPER_SIZE_STORAGE_KEY);
    return normalizeSlipPaperSize(v);
  } catch {
    return DEFAULT_SLIP_PAPER;
  }
}

export function slipPaperLabelFor(id: SlipPaperSizeId): string {
  return SLIP_PAPER_OPTIONS.find((o) => o.id === id)?.label ?? SLIP_PAPER_OPTIONS[1].label;
}
