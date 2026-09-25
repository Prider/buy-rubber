import { Prisma } from '@prisma/client';

/** True when DATABASE_URL points at PostgreSQL (production / Neon). */
export function isPostgresDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

/** Match a numeric suffix after the first character of `code` (M001, C012, …). */
export function sqlNumericCodeSuffix(): Prisma.Sql {
  if (isPostgresDatabase()) {
    return Prisma.sql`SUBSTR(code, 2) ~ '^[0-9]+$'`;
  }
  return Prisma.sql`SUBSTR(code, 2) GLOB '[0-9]*'`;
}
