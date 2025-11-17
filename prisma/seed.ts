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
  
  // ลบข้อมูลที่อ้างอิง foreign key ก่อน
  await prisma.purchase.deleteMany({});
  console.log('   - ลบข้อมูลการรับซื้อ');
  
  await prisma.productPrice.deleteMany({});
  console.log('   - ลบราคาสินค้าประจำวัน');
  await prisma.expense.deleteMany({});
  console.log('   - ลบค่าใช้จ่าย');
  
  // ลบข้อมูลหลักหลังจากลบข้อมูลที่อ้างอิงแล้ว
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

  // สร้างค่าใช้จ่ายตัวอย่าง
  console.log('💸 สร้างข้อมูลค่าใช้จ่าย...');
  const expenseCategories = [
    { category: 'ค่าน้ำมัน', description: 'ค่าน้ำมันรถรับซื้อยาง', baseAmount: 1200 },
    { category: 'ค่าซ่อมบำรุง', description: 'ค่าบำรุงรักษารถและเครื่องมือ', baseAmount: 850 },
    { category: 'ค่าคนงาน', description: 'ค่าแรงทีมงานประจำวัน', baseAmount: 1500 },
    { category: 'ค่าไฟฟ้า', description: 'ค่าไฟฟ้าโรงรับซื้อ', baseAmount: 600 },
    { category: 'ค่าเดินทาง', description: 'ค่าเดินทางไปตรวจสวนยาง', baseAmount: 700 },
  ];

  const expenses = [];
  const expenseCount = 100;

  for (let i = 0; i < expenseCount; i++) {
    const categoryInfo = expenseCategories[i % expenseCategories.length];

    const date = new Date();
    date.setDate(date.getDate() - (i % 45));
    date.setHours(12, 0, 0, 0);

    const expenseNo = `EXP${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${(i + 1).toString().padStart(3, '0')}`;
    const amount = parseFloat((categoryInfo.baseAmount + ((i % 7) * 37)).toFixed(2));
    const descriptionSuffix = i % 3 === 0 ? ' (รอบเช้า)' : i % 3 === 1 ? ' (รอบบ่าย)' : ' (รอบเย็น)';

    const expense = await prisma.expense.create({
      data: {
        expenseNo,
        date,
        category: categoryInfo.category,
        amount,
        description: `${categoryInfo.description}${descriptionSuffix}`,
      },
    });

    expenses.push(expense);

    if ((i + 1) % 20 === 0) {
      console.log(`   ✓ สร้างค่าใช้จ่ายครบ ${(i + 1)} รายการ`);
    }
  }
  console.log('✅ สร้างค่าใช้จ่าย:', expenses.length, 'รายการ');

  // สร้างสมาชิกตัวอย่าง (10 ราย)
  console.log('👥 สร้างสมาชิกตัวอย่าง...');
  
  const memberData = [
    {
      code: 'M001',
      name: 'นายสมชาย ใจดี',
      phone: '081-234-5678',
      address: 'สวนยาง ต.บ้านใหม่ อ.เมือง จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M002',
      name: 'นางสาวสมหญิง รักษ์ดี',
      phone: '082-345-6789',
      address: 'สวนยาง ต.ท่าช้าง อ.เมือง จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M003',
      name: 'นายประยุทธ์ ขยัน',
      phone: '083-456-7890',
      address: 'สวนยาง ต.คลองแห อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 60,
      tapperPercent: 40,
      tapperName: 'นายสมพงษ์ คนตัด',
    },
    {
      code: 'M004',
      name: 'นายวิศาล สมบูรณ์',
      phone: '084-567-8901',
      address: 'สวนยาง ต.คลองอู่ตะเภา อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 80,
      tapperPercent: 20,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M005',
      name: 'นางสมศรี ใจงาม',
      phone: '085-678-9012',
      address: 'สวนยาง ต.คลองหอยโข่ง อ.คลองหอยโข่ง จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M006',
      name: 'นายสมศักดิ์ รักษ์ดี',
      phone: '086-789-0123',
      address: 'สวนยาง ต.ควนเนียง อ.ควนเนียง จ.สงขลา',
      ownerPercent: 65,
      tapperPercent: 35,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M007',
      name: 'นางสาวสมพร ใจดี',
      phone: '087-890-1234',
      address: 'สวนยาง ต.รัตภูมิ อ.รัตภูมิ จ.สงขลา',
      ownerPercent: 75,
      tapperPercent: 25,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M008',
      name: 'นายสมชาย รักษ์ดี',
      phone: '088-901-2345',
      address: 'สวนยาง ต.สะเดา อ.สะเดา จ.สงขลา',
      ownerPercent: 90,
      tapperPercent: 10,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M009',
      name: 'นางสมศรี ใจงาม',
      phone: '089-012-3456',
      address: 'สวนยาง ต.จะนะ อ.จะนะ จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M010',
      name: 'นายสมศักดิ์ ขยัน',
      phone: '090-123-4567',
      address: 'สวนยาง ต.นาทวี อ.นาทวี จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมชาย คนตัด',
    },
  ];

  // Create members in batches to avoid overwhelming the database
  const members = [];
  const batchSize = 20;
  
  for (let i = 0; i < memberData.length; i += batchSize) {
    const batch = memberData.slice(i, i + batchSize);
    const batchMembers = await Promise.all(
      batch.map(data => prisma.member.create({ data }))
    );
    members.push(...batchMembers);
    console.log(`   ✓ สร้างสมาชิกรุ่นที่ ${Math.floor(i/batchSize) + 1}: ${batchMembers.length} ราย`);
  }
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

