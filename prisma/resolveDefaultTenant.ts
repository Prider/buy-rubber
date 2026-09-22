import type { PrismaClient } from '@prisma/client';

export async function resolveDefaultTenant(prisma: PrismaClient) {
  const slug = process.env.DEFAULT_TENANT_SLUG || 'demo';
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    throw new Error(`ไม่พบร้าน ${slug} — รัน npm run db:seed ก่อน`);
  }
  return tenant;
}
