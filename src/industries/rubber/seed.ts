import type { Prisma } from '@prisma/client';

export const DEFAULT_TENANT_PRODUCT_TYPES = [
  { code: 'RUBER1', name: 'ยางจอก', description: 'ยางจอก' },
  { code: 'RUBER2', name: 'ยางก้อน', description: 'ยางก้อน' },
  { code: 'RUBER3', name: 'ยางพรก', description: 'ยางพรก' },
  { code: 'RUBER4', name: 'ยางเส้น', description: 'ยางเส้น' },
  { code: 'RUBER5', name: 'ยางแผ่น', description: 'ยางแผ่น' },
] as const;

export async function seedRubberTenant(db: Prisma.TransactionClient, tenantId: string) {
  await db.productType.createMany({
    data: DEFAULT_TENANT_PRODUCT_TYPES.map((productType) => ({
      tenantId,
      code: productType.code,
      name: productType.name,
      description: productType.description,
      isActive: true,
    })),
  });
}
