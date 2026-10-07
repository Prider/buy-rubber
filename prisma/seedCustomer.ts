import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Same hash as userStore.ts / seed.ts */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

/**
 * Minimal seed for customer Electron packages.
 * Includes login accounts and product types only — no purchases, sales, members, or expenses.
 */
async function main() {
  console.log('🌱 Customer seed: clearing existing data...');

  await prisma.serviceFee.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.productPrice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.stockLedgerEntry.deleteMany({});
  await prisma.stockPosition.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.destinationCompany.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.productType.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Cleared');
  console.log('');

  const rootPassword = process.env.ROOT_PASSWORD || 'root123';

  const root = await prisma.user.create({
    data: {
      username: 'root',
      password: simpleHash(rootPassword),
      role: 'root',
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: simpleHash('admin123'),
      role: 'admin',
      isActive: true,
    },
  });

  const adminTwo = await prisma.user.create({
    data: {
      username: 'mayrin',
      password: simpleHash('mayrin123'),
      role: 'admin',
      isActive: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      username: 'user',
      password: simpleHash('user123'),
      role: 'user',
      isActive: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      username: 'demo',
      password: simpleHash('demo@123'),
      role: 'viewer',
      isActive: true,
    },
  });

  console.log('✅ Users:');
  console.log('   - Root:', root.username);
  console.log('   - Admin:', admin.username);
  console.log('   - Admin:', adminTwo.username);
  console.log('   - User:', user.username);
  console.log('   - Viewer:', viewer.username);

  const productTypes = await Promise.all([
    prisma.productType.create({
      data: { code: 'RUBER1', name: 'ยางจอก', description: 'ยางจอก' },
    }),
    prisma.productType.create({
      data: { code: 'RUBER2', name: 'ยางก้อน', description: 'ยางก้อน' },
    }),
    prisma.productType.create({
      data: { code: 'RUBER3', name: 'ยางพรก', description: 'ยางพรก' },
    }),
    prisma.productType.create({
      data: { code: 'RUBER4', name: 'ยางเส้น', description: 'ยางเส้น' },
    }),
    prisma.productType.create({
      data: { code: 'RUBER5', name: 'ยางแผ่น', description: 'ยางแผ่น' },
    }),
  ]);

  console.log('✅ Product types:', productTypes.length);
  console.log('');
  console.log('ℹ️  Purchases, sales, members, and expenses are empty (customer start).');
  console.log('');
  console.log('Login:');
  console.log(`  root / ${rootPassword}`);
  console.log('  admin / admin123');
  console.log('  mayrin / mayrin123');
  console.log('  user / user123');
  console.log('  demo / demo@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
