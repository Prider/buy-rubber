import { DEFAULT_SLIP_LOGO } from '@/lib/defaultSlipLogo';

export { DEFAULT_SLIP_LOGO };

/** Longest edge of a logo drawn on the slip, in pixels. */
export const SLIP_LOGO_MAX_EDGE = 240;

/** Stored data URLs stay well under a typical request body limit. */
export const SLIP_LOGO_MAX_CHARS = 350_000;

const SLIP_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const SLIP_LOGO_ERROR = 'ใช้ไฟล์ PNG, JPEG หรือ WebP ขนาดไม่เกิน 2 MB';

const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/**
 * Returns a safe image data URL, `''` when the logo is cleared, or `null` when the value is not a logo.
 */
export function normalizeSlipLogo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > SLIP_LOGO_MAX_CHARS) return null;
  if (!LOGO_DATA_URL.test(trimmed)) return null;
  return trimmed;
}

/**
 * A missing logo means a new install and uses the app icon.
 * A blank string means the logo was removed.
 */
export function resolveSlipLogo(value: unknown): string {
  if (value == null) return DEFAULT_SLIP_LOGO;
  return normalizeSlipLogo(value) ?? '';
}

/** Shrink an uploaded logo to a PNG data URL that can be stored with the slip settings. */
export function prepareSlipLogo(file: File): Promise<string> {
  if (!LOGO_TYPES.has(file.type) || file.size > SLIP_LOGO_MAX_BYTES) {
    return Promise.reject(new Error(SLIP_LOGO_ERROR));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(SLIP_LOGO_ERROR));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const longest = Math.max(img.width, img.height);
        const scale = longest > 0 ? Math.min(1, SLIP_LOGO_MAX_EDGE / longest) : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error(SLIP_LOGO_ERROR));
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const normalized = normalizeSlipLogo(canvas.toDataURL('image/png'));
        if (!normalized) {
          reject(new Error(SLIP_LOGO_ERROR));
          return;
        }
        resolve(normalized);
      };
      img.onerror = () => reject(new Error(SLIP_LOGO_ERROR));
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  });
}
