const DEFAULT_MAX_PRODUCT_TYPES = 50;

/** Total product types allowed, including types marked กำลังนำส่ง. */
export function getMaxProductTypes(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_MAX_PRODUCT_TYPES);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_PRODUCT_TYPES;
  return Math.floor(parsed);
}
