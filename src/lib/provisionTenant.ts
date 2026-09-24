import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import type { TenantPlan, TenantStatus } from '@/lib/auth';

export const DEFAULT_TENANT_PRODUCT_TYPES = [
  { code: 'RUBER1', name: 'ยางจอก', description: 'ยางจอก' },
  { code: 'RUBER2', name: 'ยางก้อน', description: 'ยางก้อน' },
  { code: 'RUBER3', name: 'ยางพรก', description: 'ยางพรก' },
  { code: 'RUBER4', name: 'ยางเส้น', description: 'ยางเส้น' },
  { code: 'RUBER5', name: 'ยางแผ่น', description: 'ยางแผ่น' },
] as const;

export async function provisionTenant(
  input: {
    slug: string;
    name: string;
    email?: string | null;
    address?: string | null;
    plan: TenantPlan;
    status: TenantStatus;
    adminUsername: string;
    adminPassword: string;
    adminRole?: string;
    passwordAlreadyHashed?: boolean;
  },
  tx?: Prisma.TransactionClient,
) {
  const password = input.passwordAlreadyHashed
    ? input.adminPassword
    : await hashPassword(input.adminPassword);

  const write = async (db: Prisma.TransactionClient) => {
    const tenant = await db.tenant.create({
      data: {
        slug: input.slug,
        name: input.name,
        address: input.address ?? null,
        plan: input.plan,
        status: input.status,
      },
    });
    if (input.email) {
      await db.$executeRaw`UPDATE "Tenant" SET "email" = ${input.email} WHERE "id" = ${tenant.id}`;
    }

    const user = await db.user.create({
      data: {
        tenantId: tenant.id,
        username: input.adminUsername,
        password,
        role: input.adminRole ?? 'admin',
        isActive: true,
      },
    });

    await db.productType.createMany({
      data: DEFAULT_TENANT_PRODUCT_TYPES.map((productType) => ({
        tenantId: tenant.id,
        code: productType.code,
        name: productType.name,
        description: productType.description,
        isActive: true,
      })),
    });

    await db.setting.createMany({
      data: [
        { tenantId: tenant.id, key: 'slip_companyName', value: input.name },
        { tenantId: tenant.id, key: 'slip_companyAddress', value: input.address ?? '' },
        { tenantId: tenant.id, key: 'slip_paperSize', value: '80mm' },
      ],
    });

    return { tenant, user };
  };

  if (tx) return write(tx);
  return prisma.$transaction(write);
}
