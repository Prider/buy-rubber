/**
 * Slip / receipt paper size — shared by slip HTML, PDF capture, and admin preview.
 * Widths follow CSS 96dpi mapping from physical paper width (mm): px = round(mm × 96 / 25.4).
 */

export type SlipPaperSizeId = '58mm' | '80mm' | '104mm' | 'a4';

/** ISO A4 sheet, portrait. */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const SLIP_PAPER_SIZE_STORAGE_KEY = 'slip_paperSize';

export const SLIP_PAPER_OPTIONS: ReadonlyArray<{
  id: SlipPaperSizeId;
  label: string;
  /** Short label on the paper-size control. */
  shortLabel: string;
  /** Printer the roll is for. Shown beside the width. */
  hint: string;
  /** Nominal physical width of the print column (mm). A4 uses full sheet width 210mm. */
  widthMm: number;
}> = [
  { id: '58mm', label: '58mm — เครื่องพิมพ์ความร้อนเล็ก', shortLabel: '58mm', hint: 'เครื่องพิมพ์ความร้อนเล็ก', widthMm: 58 },
  { id: '80mm', label: '80mm — เครื่องพิมพ์ความร้อนมาตรฐาน', shortLabel: '80mm', hint: 'เครื่องพิมพ์ความร้อนมาตรฐาน', widthMm: 80 },
  { id: '104mm', label: '104mm — กระดาษกว้าง', shortLabel: '104mm', hint: 'กระดาษกว้าง', widthMm: 104 },
  { id: 'a4', label: `${A4_WIDTH_MM}mm — อิงค์เจ็ต / เลเซอร์`, shortLabel: `${A4_WIDTH_MM}mm`, hint: 'อิงค์เจ็ต / เลเซอร์', widthMm: A4_WIDTH_MM },
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

/** Fixed sheet height in mm. Roll papers have no fixed height. */
export function slipSheetHeightMm(id: SlipPaperSizeId): number | null {
  return id === 'a4' ? A4_HEIGHT_MM : null;
}

/** CSS `@page { size }` value. Rolls grow with the receipt; A4 is a fixed sheet. */
export function slipPageSizeCss(id: SlipPaperSizeId): string {
  if (id === 'a4') return 'A4';
  return `${slipPageWidthMm(id)}mm auto`;
}

export function slipPaperShortLabel(id: SlipPaperSizeId): string {
  return SLIP_PAPER_OPTIONS.find((o) => o.id === id)?.shortLabel ?? id;
}

export function normalizeSlipPaperSize(raw: unknown): SlipPaperSizeId {
  if (raw === '58mm' || raw === '80mm' || raw === '104mm' || raw === 'a4') return raw;
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
