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
  
  await prisma.productPrice.deleteMany({});
  console.log('   - ลบราคาสินค้าประจำวัน');
  
  await prisma.member.deleteMany({});
  console.log('   - ลบข้อมูลสมาชิก');
  
  await prisma.productType.deleteMany({});
  console.log('   - ลบประเภทสินค้า');
  
  
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

  // สร้างราคาสินค้าตัวอย่าง (3 วันล่าสุด รวมวันนี้)
  const productPrices = [];
  
  // Get today's date at noon to avoid timezone issues
  const now = new Date();
  console.log(`System time: ${now.toISOString()}, Local date: ${now.toLocaleDateString()}`);
  
  for (let i = 0; i < 3; i++) {
    // Create date at noon local time to avoid timezone conversion issues
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(12, 0, 0, 0); // Set to noon instead of midnight
    
    const dateStr = date.toISOString().split('T')[0];
    console.log(`Creating prices for day ${i} (${dateStr}):`);
    
    // สร้างราคาสำหรับแต่ละประเภทสินค้า
    for (const productType of productTypes) {
      const basePrice = productType.code === 'FRESH' ? 50 : productType.code === 'DRY' ? 45 : 30;
      const priceVariation = i * 0.5; // ราคาลดลงทุกวัน
      
      const priceRecord = await prisma.productPrice.create({
        data: {
          date: date,
          productTypeId: productType.id,
          price: basePrice - priceVariation,
        },
      });
      
      console.log(`  ✓ ${productType.code}: ${priceRecord.price} บาท (date: ${priceRecord.date.toISOString()})`);
      productPrices.push(priceRecord);
    }
  }
  console.log('✅ สร้างราคาสินค้าตัวอย่าง:', productPrices.length, 'รายการ');

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

  console.log('✅ สร้างข้อมูลเบื้องต้นเรียบร้อย');
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

