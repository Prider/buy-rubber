/**
 * App-wide text size. Stored on this computer and applied as the root font size
 * so Tailwind rem sizes (type and spacing) scale together.
 */

export const APP_FONT_SIZE_STORAGE_KEY = 'app_fontSize';

export const APP_FONT_SIZES = [
  { id: 'sm', label: 'เล็ก', px: 14 },
  { id: 'md', label: 'ปกติ', px: 16 },
  { id: 'lg', label: 'ใหญ่', px: 18 },
  { id: 'xl', label: 'ใหญ่มาก', px: 20 },
] as const;

export type AppFontSizeId = (typeof APP_FONT_SIZES)[number]['id'];

export const DEFAULT_APP_FONT_SIZE: AppFontSizeId = 'md';

/** Pixel value written to `html` font-size, keyed by stored id. */
export const APP_FONT_SIZE_PX: Record<AppFontSizeId, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

export function normalizeAppFontSize(raw: unknown): AppFontSizeId {
  if (raw === 'sm' || raw === 'md' || raw === 'lg' || raw === 'xl') return raw;
  return DEFAULT_APP_FONT_SIZE;
}

export function appFontSizePxFor(id: AppFontSizeId): string {
  return APP_FONT_SIZE_PX[id];
}

export function getStoredAppFontSize(): AppFontSizeId {
  if (typeof window === 'undefined') return DEFAULT_APP_FONT_SIZE;
  try {
    return normalizeAppFontSize(window.localStorage.getItem(APP_FONT_SIZE_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_FONT_SIZE;
  }
}

/** Persist the choice and apply it to the document root. */
export function applyAppFontSize(raw: unknown): AppFontSizeId {
  const id = normalizeAppFontSize(raw);
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = appFontSizePxFor(id);
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(APP_FONT_SIZE_STORAGE_KEY, id);
    } catch {
      // Ignore private-mode storage failures; the size is still applied for this session.
    }
  }
  return id;
}
