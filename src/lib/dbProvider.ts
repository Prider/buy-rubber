/** True when DATABASE_URL points at PostgreSQL (production / Neon). */
export function isPostgresDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}
