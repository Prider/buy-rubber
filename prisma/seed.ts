import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple hash function (same as in userStore.ts)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

async function main() {
  console.log('🌱 เริ่มต้นการสร้างข้อมูลตัวอย่าง...');

  // ลบข้อมูลเก่าทั้งหมด (เรียงตาม foreign key dependencies)
  console.log('🗑️  ลบข้อมูลเก่าทั้งหมด...');
  
  await prisma.sale.deleteMany({});
  console.log('   - ลบข้อมูลการขาย');
  
  await prisma.payment.deleteMany({});
  console.log('   - ลบข้อมูลการจ่ายเงิน');
  
  await prisma.advance.deleteMany({});
  console.log('   - ลบข้อมูลเงินยืม');
  
  await prisma.purchase.deleteMany({});
  console.log('   - ลบข้อมูลการรับซื้อ');
  
  await prisma.priceRule.deleteMany({});
  console.log('   - ลบกฎการปรับราคา');
  
  await prisma.dailyPrice.deleteMany({});
  console.log('   - ลบราคาประกาศประจำวัน');
  
  await prisma.member.deleteMany({});
  console.log('   - ลบข้อมูลสมาชิก');
  
  await prisma.productType.deleteMany({});
  console.log('   - ลบประเภทสินค้า');
  
  await prisma.location.deleteMany({});
  console.log('   - ลบโรงรับซื้อ');
  
  await prisma.setting.deleteMany({});
  console.log('   - ลบการตั้งค่าระบบ');
  
  await prisma.user.deleteMany({});
  console.log('   - ลบผู้ใช้งาน');
  
  console.log('✅ ลบข้อมูลเก่าเรียบร้อยแล้ว');
  console.log('');

  // สร้างผู้ใช้งาน
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: simpleHash('admin123'),
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
      username: 'viewer',
      password: simpleHash('viewer123'),
      role: 'viewer',
      isActive: true,
    },
  });
  
  console.log('✅ สร้างผู้ใช้งาน:');
  console.log('   - Admin:', admin.username, '(Full access)');
  console.log('   - User:', user.username, '(Edit access)');
  console.log('   - Viewer:', viewer.username, '(Read-only)');

  // สร้างโรงรับซื้อ
  const location = await prisma.location.create({
    data: {
      code: 'LOC001',
      name: 'โรงรับซื้อยางสาขาหลัก',
      address: '123 ถนนพระราม 4 กรุงเทพฯ',
      phone: '02-123-4567',
    },
  });
  console.log('✅ สร้างโรงรับซื้อ:', location.name);

  // สร้างประเภทสินค้า
  const productTypes = await Promise.all([
    prisma.productType.create({
      data: {
        code: 'FRESH',
        name: 'น้ำยางสด',
        description: 'น้ำยางสดจากต้นยางพารา',
      },
    }),
    prisma.productType.create({
      data: {
        code: 'DRY',
        name: 'ยางแห้ง',
        description: 'ยางแผ่นดิบ',
      },
    }),
    prisma.productType.create({
      data: {
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
  
  const dailyPrice = await prisma.dailyPrice.create({
    data: {
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
  await prisma.setting.create({
    data: {
      key: 'company_name',
      value: 'บริษัท รับซื้อยางพารา จำกัด',
    },
  });

  await prisma.setting.create({
    data: {
      key: 'tax_id',
      value: '0-1234-56789-01-2',
    },
  });

  console.log('✅ สร้างตั้งค่าระบบเรียบร้อย');
  console.log('');
  console.log('🎉 สร้างข้อมูลตัวอย่างเสร็จสมบูรณ์!');
  console.log('');
  console.log('ข้อมูลการเข้าสู่ระบบ:');
  console.log('');
  console.log('  👤 Admin Account (Full access):');
  console.log('     Username: admin');
  console.log('     Password: admin123');
  console.log('');
  console.log('  👤 User Account (Edit access):');
  console.log('     Username: user');
  console.log('     Password: user123');
  console.log('');
  console.log('  👤 Viewer Account (Read-only):');
  console.log('     Username: viewer');
  console.log('     Password: viewer123');
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

