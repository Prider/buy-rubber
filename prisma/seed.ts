/**
 * Seeds the same baseline data as prisma/backups/initial-data.db:
 * users, product types, members, backup settings, and report groups.
 * Purchases, sales, expenses, and stock tables stay empty.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Same hash as userStore.ts
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

/** One account per UserRole in src/types/user.ts. */
const USERS = [
  { username: 'root', password: simpleHash('root888'), role: 'root' },
  { username: 'owner', password: simpleHash('owner888'), role: 'admin' },
  { username: 'manager', password: simpleHash('manager888'), role: 'user' },
  { username: 'accountant', password: simpleHash('accountant888'), role: 'accountant' },
  { username: 'employee', password: simpleHash('employee888'), role: 'viewer' },
] as const;

const PRODUCT_TYPES = [
  { code: 'RUBER1', name: 'ยางจอก01', description: 'ยางจอก' },
  { code: 'RUBER2', name: 'ยางก้อน01', description: 'ยางก้อน' },
  { code: 'RUBER3', name: 'ยางพรก01', description: 'ยางพรก' },
  { code: 'RUBER4', name: 'ยางเส้น', description: 'ยางเส้น' },
  { code: 'RUBER5', name: 'ยางแผ่น', description: 'ยางแผ่น' },
  { code: 'NUTS', name: 'หมาก', description: null },
] as const;

const MEMBERS: Array<{
  code: string;
  name: string;
  ownerPercent: number;
  tapperPercent: number;
  tapperName: string;
}> = [
  { code: 'M001', name: 'ชาวสวน', ownerPercent: 70, tapperPercent: 30, tapperName: 'นายสมศักดิ์ คนตัด' },
  { code: 'M002', name: 'เจมส์', ownerPercent: 100, tapperPercent: 0, tapperName: '' },
  { code: 'M003', name: 'เจ', ownerPercent: 60, tapperPercent: 40, tapperName: 'นายสมพงษ์ คนตัด' },
  { code: 'M004', name: 'โกเชื้อง', ownerPercent: 80, tapperPercent: 20, tapperName: 'นายสมพร คนตัด' },
  { code: 'M005', name: 'สุพ่วง', ownerPercent: 100, tapperPercent: 0, tapperName: '' },
  { code: 'M006', name: 'อาร์ม', ownerPercent: 65, tapperPercent: 35, tapperName: 'นายสมชาย คนตัด' },
  { code: 'M007', name: 'เกียรติ', ownerPercent: 75, tapperPercent: 25, tapperName: 'นายสมศักดิ์ คนตัด' },
  { code: 'M008', name: 'สา', ownerPercent: 90, tapperPercent: 10, tapperName: 'นายสมพร คนตัด' },
  { code: 'M009', name: 'ชัน', ownerPercent: 100, tapperPercent: 0, tapperName: '' },
  { code: 'M010', name: 'ยายยง', ownerPercent: 70, tapperPercent: 30, tapperName: 'นายสมชาย คนตัด' },
]

const SETTINGS = [
  { key: 'backup_enabled', value: 'true' },
  { key: 'backup_frequency', value: 'weekly' },
  { key: 'backup_weekly_day', value: '1' },
  { key: 'backup_time', value: '17:14' },
  { key: 'backup_max_count', value: '30' },
  { key: 'backup_auto_cleanup', value: 'true' },
  { key: 'backup_monthly_day', value: '1' },
] as const;

/** One unnamed group per product type, for both purchase and sale reports. */
const REPORT_GROUP_PRODUCT_CODES = [
  'NUTS',
  'RUBER1',
  'RUBER2',
  'RUBER3',
  'RUBER4',
  'RUBER5',
] as const;

async function clearAll() {
  console.log('🗑️  ลบข้อมูลเก่าทั้งหมด...');

  await prisma.saleExpense.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.productPrice.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.stockLedgerEntry.deleteMany({});
  await prisma.stockPosition.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.destinationCompany.deleteMany({});
  await prisma.reportProductTypeGroupMember.deleteMany({});
  await prisma.reportProductTypeGroup.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.productType.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.backup.deleteMany({});

  console.log('✅ ลบข้อมูลเก่าเรียบร้อยแล้ว');
  console.log('');
}

async function main() {
  console.log('🌱 เริ่มต้นการสร้างข้อมูลจาก prisma/backups/initial-data.db ...');
  console.log('');

  await clearAll();

  await prisma.user.createMany({
    data: USERS.map((user) => ({
      username: user.username,
      password: user.password,
      role: user.role,
      isActive: true,
    })),
  });
  console.log('✅ สร้างผู้ใช้งาน:', USERS.length, 'ราย');

  const productTypes = await prisma.productType.createManyAndReturn({
    data: PRODUCT_TYPES.map((productType) => ({
      code: productType.code,
      name: productType.name,
      description: productType.description,
      isActive: true,
    })),
  });
  const productTypeByCode = Object.fromEntries(
    productTypes.map((productType) => [productType.code, productType]),
  );
  console.log('✅ สร้างประเภทสินค้า:', productTypes.length, 'ประเภท');

  await prisma.member.createMany({
    data: MEMBERS.map((member) => ({
      code: member.code,
      name: member.name,
      phone: '',
      address: '',
      ownerPercent: member.ownerPercent,
      tapperPercent: member.tapperPercent,
      tapperName: member.tapperName,
      isActive: true,
    })),
  });
  console.log('✅ สร้างสมาชิก:', MEMBERS.length, 'ราย');

  await prisma.setting.createMany({
    data: SETTINGS.map((setting) => ({
      key: setting.key,
      value: setting.value,
    })),
  });
  console.log('✅ สร้างการตั้งค่า:', SETTINGS.length, 'รายการ');

  for (const kind of ['purchase', 'sale'] as const) {
    for (const code of REPORT_GROUP_PRODUCT_CODES) {
      const productType = productTypeByCode[code];
      if (!productType) {
        throw new Error(`Missing product type ${code}`);
      }
      await prisma.reportProductTypeGroup.create({
        data: {
          name: null,
          kind,
          sortOrder: 0,
          isActive: true,
          productTypes: {
            create: { productTypeId: productType.id },
          },
        },
      });
    }
  }
  console.log(
    '✅ สร้างกลุ่มรายงาน:',
    REPORT_GROUP_PRODUCT_CODES.length * 2,
    'กลุ่ม (รับซื้อ/ขาย ประเภทละ 1 กลุ่ม)',
  );

  console.log('');
  console.log('🎉 สร้างข้อมูลตัวอย่างเสร็จสมบูรณ์!');
  console.log('');
  console.log('ข้อมูลการเข้าสู่ระบบ:');
  console.log('');
  console.log('  Username: root        Password: root888        (ผู้ดูแล)');
  console.log('  Username: owner       Password: owner888       (เจ้าของ)');
  console.log('  Username: manager     Password: manager888     (ผู้จัดการ)');
  console.log('  Username: accountant  Password: accountant888  (บัญชี)');
  console.log('  Username: employee    Password: employee888    (พนักงาน)');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
