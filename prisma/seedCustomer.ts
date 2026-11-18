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

  const users = await prisma.user.createMany({
    data: [
      { username: 'root', password: simpleHash('root888'), role: 'root', isActive: true },
      { username: 'owner', password: simpleHash('owner888'), role: 'admin', isActive: true },
      { username: 'manager', password: simpleHash('manager888'), role: 'user', isActive: true },
      { username: 'accountant', password: simpleHash('accountant888'), role: 'accountant', isActive: true },
      { username: 'employee', password: simpleHash('employee888'), role: 'viewer', isActive: true },
    ],
  });

  console.log('✅ Users:', users.count);

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
  console.log('  root / root888         (ผู้ดูแล)');
  console.log('  owner / owner888       (เจ้าของ)');
  console.log('  manager / manager888   (ผู้จัดการ)');
  console.log('  accountant / accountant888 (บัญชี)');
  console.log('  employee / employee888 (พนักงาน)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
