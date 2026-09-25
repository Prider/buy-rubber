import type { Prisma } from '@prisma/client';
import { prisma } from '@/platform/prisma';
import { hashPassword } from '@/platform/auth';
import type { TenantPlan, TenantStatus } from '@/platform/auth';

export async function provisionTenant(
  input: {
    slug: string;
    name: string;
    email?: string | null;
    address?: string | null;
    plan: TenantPlan;
    status: TenantStatus;
    industry?: string;
    adminUsername: string;
    adminPassword: string;
    adminRole?: string;
    passwordAlreadyHashed?: boolean;
    seed?: (db: Prisma.TransactionClient, tenantId: string) => Promise<void>;
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
        industry: input.industry ?? 'rubber',
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

    if (input.seed) {
      await input.seed(db, tenant.id);
    }

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
