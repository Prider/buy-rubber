/**
 * App canvas color for light and dark mode. Stored on this computer and applied
 * through CSS variables so the page background updates without a reload.
 */

export const APP_BG_LIGHT_STORAGE_KEY = 'app_bgLight';
export const APP_BG_DARK_STORAGE_KEY = 'app_bgDark';

export const APP_BG_LIGHT = [
  { id: 'off-white', label: 'ขาวอมเทา', hint: 'Off-white', hex: '#F9FAFB' },
  { id: 'soft-cream', label: 'ครีมอ่อน', hint: 'Soft cream', hex: '#F6F1E7' },
  { id: 'light-gray', label: 'เทาอ่อน', hint: 'Light gray', hex: '#E8EAED' },
] as const;

export const APP_BG_DARK = [
  { id: 'dark-charcoal', label: 'ถ่านเข้ม', hint: 'Dark charcoal', hex: '#111827' },
  { id: 'near-black', label: 'ดำสนิท', hint: 'Near black', hex: '#030712' },
  { id: 'warm-charcoal', label: 'ถ่านอุ่น', hint: 'Warm charcoal', hex: '#1C1917' },
] as const;

/**
 * Neutral surfaces for one mode. Channel values are space-separated RGB so
 * Tailwind opacity modifiers (`bg-white/80`) keep working.
 * `surface` paints cards, the sidebar and panels. `canvas` paints the page.
 */
type LightTone = {
  '--tone-surface': string;
  '--tone-surface-hex': string;
  '--tone-canvas-light': string;
  '--tone-muted-light': string;
  '--tone-chip-light': string;
  '--tone-border-soft': string;
  '--tone-border': string;
  '--app-bg-light': string;
};

type DarkTone = {
  '--tone-panel': string;
  '--tone-panel-hex': string;
  '--tone-deep': string;
  '--tone-inset': string;
  '--tone-chip-dark': string;
  '--app-bg-dark': string;
};

export type AppBgLightId = (typeof APP_BG_LIGHT)[number]['id'];
export type AppBgDarkId = (typeof APP_BG_DARK)[number]['id'];

export const DEFAULT_APP_BG_LIGHT: AppBgLightId = 'off-white';
export const DEFAULT_APP_BG_DARK: AppBgDarkId = 'dark-charcoal';

export const APP_BG_LIGHT_HEX: Record<AppBgLightId, string> = {
  'off-white': '#F9FAFB',
  'soft-cream': '#F6F1E7',
  'light-gray': '#E8EAED',
};

export const APP_BG_DARK_HEX: Record<AppBgDarkId, string> = {
  'dark-charcoal': '#111827',
  'near-black': '#030712',
  'warm-charcoal': '#1C1917',
};

/** Default light theme keeps today's white cards on an off-white page. */
export const APP_BG_LIGHT_TONE: Record<AppBgLightId, LightTone> = {
  'off-white': {
    '--tone-surface': '255 255 255',
    '--tone-surface-hex': '#ffffff',
    '--tone-canvas-light': '249 250 251',
    '--tone-muted-light': '243 244 246',
    '--tone-chip-light': '229 231 235',
    '--tone-border-soft': '243 244 246',
    '--tone-border': '229 231 235',
    '--app-bg-light': '#F9FAFB',
  },
  'soft-cream': {
    '--tone-surface': '246 241 231',
    '--tone-surface-hex': '#F6F1E7',
    '--tone-canvas-light': '246 241 231',
    '--tone-muted-light': '232 220 200',
    '--tone-chip-light': '220 206 180',
    '--tone-border-soft': '226 214 190',
    '--tone-border': '210 194 164',
    '--app-bg-light': '#F6F1E7',
  },
  'light-gray': {
    '--tone-surface': '232 234 237',
    '--tone-surface-hex': '#E8EAED',
    '--tone-canvas-light': '232 234 237',
    '--tone-muted-light': '213 216 220',
    '--tone-chip-light': '198 203 208',
    '--tone-border-soft': '200 205 210',
    '--tone-border': '176 182 188',
    '--app-bg-light': '#E8EAED',
  },
};

/** Default dark theme keeps today's gray-800 cards on a charcoal page. */
export const APP_BG_DARK_TONE: Record<AppBgDarkId, DarkTone> = {
  'dark-charcoal': {
    '--tone-panel': '31 41 55',
    '--tone-panel-hex': '#1F2937',
    '--tone-deep': '17 24 39',
    '--tone-inset': '55 65 81',
    '--tone-chip-dark': '75 85 99',
    '--app-bg-dark': '#111827',
  },
  'near-black': {
    '--tone-panel': '3 7 18',
    '--tone-panel-hex': '#030712',
    '--tone-deep': '3 7 18',
    '--tone-inset': '26 35 50',
    '--tone-chip-dark': '36 48 68',
    '--app-bg-dark': '#030712',
  },
  'warm-charcoal': {
    '--tone-panel': '28 25 23',
    '--tone-panel-hex': '#1C1917',
    '--tone-deep': '28 25 23',
    '--tone-inset': '63 58 54',
    '--tone-chip-dark': '87 83 78',
    '--app-bg-dark': '#1C1917',
  },
};

export function normalizeAppBgLight(raw: unknown): AppBgLightId {
  if (raw === 'off-white' || raw === 'soft-cream' || raw === 'light-gray') return raw;
  return DEFAULT_APP_BG_LIGHT;
}

export function normalizeAppBgDark(raw: unknown): AppBgDarkId {
  if (raw === 'dark-charcoal' || raw === 'near-black' || raw === 'warm-charcoal') return raw;
  return DEFAULT_APP_BG_DARK;
}

export function getStoredAppBgLight(): AppBgLightId {
  if (typeof window === 'undefined') return DEFAULT_APP_BG_LIGHT;
  try {
    return normalizeAppBgLight(window.localStorage.getItem(APP_BG_LIGHT_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_BG_LIGHT;
  }
}

export function getStoredAppBgDark(): AppBgDarkId {
  if (typeof window === 'undefined') return DEFAULT_APP_BG_DARK;
  try {
    return normalizeAppBgDark(window.localStorage.getItem(APP_BG_DARK_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_BG_DARK;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore private-mode storage failures; the color is still applied for this session.
  }
}

function applyTone(vars: Record<string, string>) {
  if (typeof document === 'undefined') return;
  const style = document.documentElement.style;
  for (const [name, value] of Object.entries(vars)) {
    style.setProperty(name, value);
  }
}

/** Persist the light-mode palette and paint cards, panels and the page. */
export function applyAppBgLight(raw: unknown): AppBgLightId {
  const id = normalizeAppBgLight(raw);
  applyTone(APP_BG_LIGHT_TONE[id]);
  writeStorage(APP_BG_LIGHT_STORAGE_KEY, id);
  return id;
}

/** Persist the dark-mode palette and paint cards, panels and the page. */
export function applyAppBgDark(raw: unknown): AppBgDarkId {
  const id = normalizeAppBgDark(raw);
  applyTone(APP_BG_DARK_TONE[id]);
  writeStorage(APP_BG_DARK_STORAGE_KEY, id);
  return id;
}
