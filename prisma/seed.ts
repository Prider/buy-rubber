import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 เริ่มต้นการสร้างข้อมูลตัวอย่าง...');

  // สร้างผู้ใช้งาน
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
    },
  });
  console.log('✅ สร้างผู้ใช้งาน:', admin.name);

  // สร้างโรงรับซื้อ
  const location = await prisma.location.upsert({
    where: { code: 'LOC001' },
    update: {},
    create: {
      code: 'LOC001',
      name: 'โรงรับซื้อยางสาขาหลัก',
      address: '123 ถนนพระราม 4 กรุงเทพฯ',
      phone: '02-123-4567',
    },
  });
  console.log('✅ สร้างโรงรับซื้อ:', location.name);

  // สร้างประเภทสินค้า
  const productTypes = await Promise.all([
    prisma.productType.upsert({
      where: { code: 'FRESH' },
      update: {},
      create: {
        code: 'FRESH',
        name: 'น้ำยางสด',
        description: 'น้ำยางสดจากต้นยางพารา',
      },
    }),
    prisma.productType.upsert({
      where: { code: 'DRY' },
      update: {},
      create: {
        code: 'DRY',
        name: 'ยางแห้ง',
        description: 'ยางแผ่นดิบ',
      },
    }),
    prisma.productType.upsert({
      where: { code: 'SCRAP' },
      update: {},
      create: {
        code: 'SCRAP',
        name: 'เศษยาง',
        description: 'เศษยางคละ',
      },
    }),
  ]);
  console.log('✅ สร้างประเภทสินค้า:', productTypes.length, 'ประเภท');

  // สร้างราคาประกาศวันนี้
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyPrice = await prisma.dailyPrice.upsert({
    where: {
      date_locationId: {
        date: today,
        locationId: location.id,
      },
    },
    update: {},
    create: {
      date: today,
      locationId: location.id,
      basePrice: 50.0, // 50 บาท/กก.
    },
  });
  console.log('✅ สร้างราคาประกาศประจำวัน:', dailyPrice.basePrice, 'บาท/กก.');

  // สร้างกฎการปรับราคา
  const priceRules = await Promise.all([
    prisma.priceRule.create({
      data: {
        dailyPriceId: dailyPrice.id,
        minPercent: 0,
        maxPercent: 29.99,
        adjustment: -5.0, // ลด 5 บาท
      },
    }),
    prisma.priceRule.create({
      data: {
        dailyPriceId: dailyPrice.id,
        minPercent: 30,
        maxPercent: 34.99,
        adjustment: 0, // ราคาปกติ
      },
    }),
    prisma.priceRule.create({
      data: {
        dailyPriceId: dailyPrice.id,
        minPercent: 35,
        maxPercent: 100,
        adjustment: 5.0, // เพิ่ม 5 บาท
      },
    }),
  ]);
  console.log('✅ สร้างกฎการปรับราคา:', priceRules.length, 'กฎ');

  // สร้างสมาชิกตัวอย่าง
  const members = await Promise.all([
    prisma.member.create({
      data: {
        code: 'M001',
        name: 'นายสมชาย ใจดี',
        phone: '081-234-5678',
        address: 'สวนยาง ต.บ้านใหม่ อ.เมือง จ.สงขลา',
        ownerPercent: 70,
        tapperPercent: 30,
        tapperName: 'นายสมศักดิ์ คนตัด',
      },
    }),
    prisma.member.create({
      data: {
        code: 'M002',
        name: 'นางสาวสมหญิง รักษ์ดี',
        phone: '082-345-6789',
        address: 'สวนยาง ต.ท่าช้าง อ.เมือง จ.สงขลา',
        ownerPercent: 100,
        tapperPercent: 0,
      },
    }),
    prisma.member.create({
      data: {
        code: 'M003',
        name: 'นายประยุทธ์ ขยัน',
        phone: '083-456-7890',
        address: 'สวนยาง ต.คลองแห อ.หาดใหญ่ จ.สงขลา',
        ownerPercent: 60,
        tapperPercent: 40,
        tapperName: 'นายสมพงษ์ คนตัด',
      },
    }),
  ]);
  console.log('✅ สร้างสมาชิก:', members.length, 'ราย');

  // สร้างตั้งค่าระบบ
  await prisma.setting.upsert({
    where: { key: 'company_name' },
    update: { value: 'บริษัท รับซื้อยางพารา จำกัด' },
    create: {
      key: 'company_name',
      value: 'บริษัท รับซื้อยางพารา จำกัด',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'tax_id' },
    update: { value: '0-1234-56789-01-2' },
    create: {
      key: 'tax_id',
      value: '0-1234-56789-01-2',
    },
  });

  console.log('✅ สร้างตั้งค่าระบบเรียบร้อย');
  console.log('');
  console.log('🎉 สร้างข้อมูลตัวอย่างเสร็จสมบูรณ์!');
  console.log('');
  console.log('ข้อมูลการเข้าสู่ระบบ:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

