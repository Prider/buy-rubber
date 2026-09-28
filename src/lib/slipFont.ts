/**
 * Slip text size. H2 is the default.
 * H4 and H3 are smaller. H1 is larger. Every line scales together.
 */

export type SlipFontSizeId = 'h4' | 'h3' | 'h2' | 'h1';

export const SLIP_FONT_SIZE_STORAGE_KEY = 'slip_fontSize';

export const SLIP_FONT_OPTIONS: ReadonlyArray<{
  id: SlipFontSizeId;
  label: string;
  /** Percent of the built-in slip sizes. H3 is 100. */
  percent: number;
}> = [
  { id: 'h4', label: 'H4', percent: 80 },
  { id: 'h3', label: 'H3', percent: 100 },
  { id: 'h2', label: 'H2', percent: 120 },
  { id: 'h1', label: 'H1', percent: 160 },
];

const DEFAULT_SLIP_FONT: SlipFontSizeId = 'h2';

const LEGACY_FONT_SIZE: Record<string, SlipFontSizeId> = {
  small: 'h4',
  normal: 'h3',
  large: 'h2',
};

export function normalizeSlipFontSize(raw: unknown): SlipFontSizeId {
  if (raw === 'h4' || raw === 'h3' || raw === 'h2' || raw === 'h1') return raw;
  if (typeof raw === 'string' && raw in LEGACY_FONT_SIZE) return LEGACY_FONT_SIZE[raw];

  const percent = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw.trim()) : NaN;
  if (!Number.isFinite(percent)) return DEFAULT_SLIP_FONT;

  return SLIP_FONT_OPTIONS.reduce((closest, option) => {
    const closestDistance = Math.abs(slipFontPercentFor(closest) - percent);
    const optionDistance = Math.abs(option.percent - percent);
    return optionDistance < closestDistance ? option.id : closest;
  }, DEFAULT_SLIP_FONT);
}

export function slipFontPercentFor(id: SlipFontSizeId): number {
  return SLIP_FONT_OPTIONS.find((option) => option.id === id)?.percent ?? 120;
}

export function slipFontLabelFor(id: SlipFontSizeId): string {
  return SLIP_FONT_OPTIONS.find((option) => option.id === id)?.label ?? 'H2';
}

/** Rounded CSS px for a base size at the chosen heading size. H3 keeps the base. */
export function slipFontPx(basePx: number, id: SlipFontSizeId): number {
  return Math.round((basePx * slipFontPercentFor(id)) / 100);
}

export function getStoredSlipFontSize(): SlipFontSizeId {
  if (typeof window === 'undefined') return DEFAULT_SLIP_FONT;
  try {
    return normalizeSlipFontSize(window.localStorage.getItem(SLIP_FONT_SIZE_STORAGE_KEY));
  } catch {
    return DEFAULT_SLIP_FONT;
  }
}
