import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const DEFAULT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'demo';
const POS_TABLES = [
  'User',
  'Member',
  'DestinationCompany',
  'ProductType',
  'ProductPrice',
  'Purchase',
  'Expense',
  'ServiceFee',
  'Setting',
  'Backup',
  'Sale',
  'StockPosition',
  'StockLedgerEntry',
  'StockGang',
  'ReportProductTypeGroup',
] as const;

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    name,
  );
  return Boolean(rows[0]?.exists);
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     ) AS exists`,
    table,
    column,
  );
  return Boolean(rows[0]?.exists);
}

async function main() {
  console.log('Migrating existing shop data into a default tenant...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tenant" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "plan" TEXT NOT NULL DEFAULT 'freemium',
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Tenant_status_idx" ON "Tenant"("status")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Tenant_plan_idx" ON "Tenant"("plan")`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PlatformUser" (
      "id" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PlatformUser_username_key" ON "PlatformUser"("username")`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PlatformSettings" (
      "id" TEXT NOT NULL,
      "bankName" TEXT NOT NULL DEFAULT '',
      "accountName" TEXT NOT NULL DEFAULT '',
      "accountNumber" TEXT NOT NULL DEFAULT '',
      "promptPayId" TEXT NOT NULL DEFAULT '',
      "qrImage" BYTEA,
      "qrImageMimeType" TEXT,
      "premiumPriceThb" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentRequest" (
      "id" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "slipImage" BYTEA NOT NULL,
      "slipMimeType" TEXT NOT NULL,
      "note" TEXT,
      "rejectReason" TEXT,
      "reviewedBy" TEXT,
      "reviewedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PaymentRequest_tenantId_status_idx" ON "PaymentRequest"("tenantId", "status")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PaymentRequest_status_createdAt_idx" ON "PaymentRequest"("status", "createdAt")`);

  for (const table of POS_TABLES) {
    if (!(await tableExists(table))) continue;
    if (await columnExists(table, 'tenantId')) continue;
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "tenantId" TEXT`);
    console.log(`Added nullable tenantId to ${table}`);
  }

  let tenant = await prisma.tenant.findUnique({ where: { slug: DEFAULT_SLUG } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        slug: DEFAULT_SLUG,
        name: 'ร้านตัวอย่าง',
        address: '',
        plan: 'premium',
        status: 'active',
      },
    });
    console.log('Created default tenant', tenant.slug);
  } else {
    console.log('Using existing tenant', tenant.slug);
  }

  const ownerUsername = process.env.PLATFORM_OWNER_USERNAME || 'owner';
  const existingOwner = await prisma.platformUser.findUnique({ where: { username: ownerUsername } });
  if (!existingOwner) {
    await prisma.platformUser.create({
      data: {
        username: ownerUsername,
        password: simpleHash(process.env.PLATFORM_OWNER_PASSWORD || 'owner123'),
        isActive: true,
      },
    });
    console.log('Created platform owner', ownerUsername);
  }

  const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    await prisma.platformSettings.create({
      data: {
        id: 'default',
        bankName: 'ธนาคารกสิกรไทย',
        accountName: 'บริษัท ปันสุข อินโนเทค',
        accountNumber: '123-4-56789-0',
        promptPayId: '0123456789',
        premiumPriceThb: 1990,
      },
    });
    console.log('Created default platform payment settings');
  }

  for (const table of POS_TABLES) {
    if (!(await tableExists(table))) continue;
    if (!(await columnExists(table, 'tenantId'))) continue;
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
      tenant.id,
    );
    console.log(`Backfilled ${table}: ${result} rows`);
  }

  console.log('Backfill complete. Run `npx prisma db push` next to apply remaining constraints.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
