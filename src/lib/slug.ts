const RESERVED_SLUGS = new Set([
  'login',
  'signup',
  'api',
  'admin',
  'platform',
  'landing',
  'dashboard',
  'profile',
  'www',
  'app',
  'static',
  'assets',
  'health',
  'backup',
  'purchases',
  'sales',
  'members',
  'reports',
  'stock',
  'expenses',
]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateSlug(raw: string): { ok: true; slug: string } | { ok: false; message: string } {
  const slug = normalizeSlug(raw);
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      message: 'รหัสร้านต้องเป็นตัวพิมพ์เล็ก a-z, 0-9 และขีดกลาง ความยาว 3-32 ตัวอักษร',
    };
  }
  if (slug.includes('--')) {
    return { ok: false, message: 'รหัสร้านห้ามมีขีดกลางติดกัน' };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, message: 'รหัสร้านนี้ถูกสงวนไว้ กรุณาใช้ชื่ออื่น' };
  }
  return { ok: true, slug };
}

export { RESERVED_SLUGS, SLUG_PATTERN };
