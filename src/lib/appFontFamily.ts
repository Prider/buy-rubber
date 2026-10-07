/**
 * App-wide typeface. Stored on this computer and applied through CSS variables
 * so body text and shared controls pick up the same face.
 */

export const APP_FONT_FAMILY_STORAGE_KEY = 'app_fontFamily';

/** Matches the historical `body` stack in globals.css. */
export const SYSTEM_APP_FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

/** Animal Island controls stay on Nunito until a named face is chosen. */
export const DEFAULT_CONTROL_FONT_STACK =
  "Nunito, 'Noto Sans SC', -apple-system, sans-serif";

export const APP_FONT_FAMILIES = [
  { id: 'system', label: 'ค่าเริ่มต้น', stack: SYSTEM_APP_FONT_STACK },
  { id: 'sarabun', label: 'Sarabun', stack: "var(--font-sarabun), 'Sarabun', sans-serif" },
  { id: 'noto', label: 'Noto Sans Thai', stack: "var(--font-noto-sans-thai), 'Noto Sans Thai', sans-serif" },
  { id: 'prompt', label: 'Prompt', stack: "var(--font-prompt), 'Prompt', sans-serif" },
  { id: 'kanit', label: 'Kanit', stack: "var(--font-kanit), 'Kanit', sans-serif" },
] as const;

export type AppFontFamilyId = (typeof APP_FONT_FAMILIES)[number]['id'];

export const DEFAULT_APP_FONT_FAMILY: AppFontFamilyId = 'system';

export const APP_FONT_FAMILY_STACKS: Record<AppFontFamilyId, string> = {
  system: SYSTEM_APP_FONT_STACK,
  sarabun: "var(--font-sarabun), 'Sarabun', sans-serif",
  noto: "var(--font-noto-sans-thai), 'Noto Sans Thai', sans-serif",
  prompt: "var(--font-prompt), 'Prompt', sans-serif",
  kanit: "var(--font-kanit), 'Kanit', sans-serif",
};

export function normalizeAppFontFamily(raw: unknown): AppFontFamilyId {
  if (raw === 'system' || raw === 'sarabun' || raw === 'noto' || raw === 'prompt' || raw === 'kanit') {
    return raw;
  }
  return DEFAULT_APP_FONT_FAMILY;
}

export function appFontFamilyStackFor(id: AppFontFamilyId): string {
  return APP_FONT_FAMILY_STACKS[id];
}

/** Named faces replace control fonts; the default keeps the existing Nunito controls. */
export function appControlFontStackFor(id: AppFontFamilyId): string {
  if (id === 'system') return DEFAULT_CONTROL_FONT_STACK;
  return APP_FONT_FAMILY_STACKS[id];
}

export function getStoredAppFontFamily(): AppFontFamilyId {
  if (typeof window === 'undefined') return DEFAULT_APP_FONT_FAMILY;
  try {
    return normalizeAppFontFamily(window.localStorage.getItem(APP_FONT_FAMILY_STORAGE_KEY));
  } catch {
    return DEFAULT_APP_FONT_FAMILY;
  }
}

/** Persist the choice and apply it to the document root. */
export function applyAppFontFamily(raw: unknown): AppFontFamilyId {
  const id = normalizeAppFontFamily(raw);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--app-font-family', appFontFamilyStackFor(id));
    const controlStack = appControlFontStackFor(id);
    root.style.setProperty('--animal-font-family', controlStack);
    root.style.setProperty('--app-control-font-family', controlStack);
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(APP_FONT_FAMILY_STORAGE_KEY, id);
    } catch {
      // Ignore private-mode storage failures; the face is still applied for this session.
    }
  }
  return id;
}
