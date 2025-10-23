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

  // สร้างสมาชิกตัวอย่าง (103 ราย)
  console.log('👥 สร้างสมาชิกตัวอย่าง...');
  
  const memberData = [
    // Original 3 members
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
    // Additional 100 members
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
    {
      code: 'M011',
      name: 'นางสาวสมพร สมบูรณ์',
      phone: '091-234-5678',
      address: 'สวนยาง ต.เทพา อ.เทพา จ.สงขลา',
      ownerPercent: 85,
      tapperPercent: 15,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M012',
      name: 'นายสมชาย ใจงาม',
      phone: '092-345-6789',
      address: 'สวนยาง ต.สะบ้าย้อย อ.สะบ้าย้อย จ.สงขลา',
      ownerPercent: 60,
      tapperPercent: 40,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M013',
      name: 'นางสมศรี รักษ์ดี',
      phone: '093-456-7890',
      address: 'สวนยาง ต.ระโนด อ.ระโนด จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M014',
      name: 'นายสมศักดิ์ ใจดี',
      phone: '094-567-8901',
      address: 'สวนยาง ต.กระแสสินธุ์ อ.กระแสสินธุ์ จ.สงขลา',
      ownerPercent: 80,
      tapperPercent: 20,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M015',
      name: 'นางสาวสมพร ขยัน',
      phone: '095-678-9012',
      address: 'สวนยาง ต.เกาะยอ อ.เมือง จ.สงขลา',
      ownerPercent: 75,
      tapperPercent: 25,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M016',
      name: 'นายสมชาย สมบูรณ์',
      phone: '096-789-0123',
      address: 'สวนยาง ต.คลองแงะ อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 90,
      tapperPercent: 10,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M017',
      name: 'นางสมศรี ใจงาม',
      phone: '097-890-1234',
      address: 'สวนยาง ต.คลองหลา อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M018',
      name: 'นายสมศักดิ์ รักษ์ดี',
      phone: '098-901-2345',
      address: 'สวนยาง ต.คลองหอยโข่ง อ.คลองหอยโข่ง จ.สงขลา',
      ownerPercent: 65,
      tapperPercent: 35,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M019',
      name: 'นางสาวสมพร ใจดี',
      phone: '099-012-3456',
      address: 'สวนยาง ต.ควนเนียง อ.ควนเนียง จ.สงขลา',
      ownerPercent: 85,
      tapperPercent: 15,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M020',
      name: 'นายสมชาย ขยัน',
      phone: '080-123-4567',
      address: 'สวนยาง ต.รัตภูมิ อ.รัตภูมิ จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมพร คนตัด',
    },
    // Continue with more members...
    {
      code: 'M021',
      name: 'นางสมศรี สมบูรณ์',
      phone: '081-234-5679',
      address: 'สวนยาง ต.สะเดา อ.สะเดา จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M022',
      name: 'นายสมศักดิ์ ใจงาม',
      phone: '082-345-6780',
      address: 'สวนยาง ต.จะนะ อ.จะนะ จ.สงขลา',
      ownerPercent: 80,
      tapperPercent: 20,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M023',
      name: 'นางสาวสมพร รักษ์ดี',
      phone: '083-456-7891',
      address: 'สวนยาง ต.นาทวี อ.นาทวี จ.สงขลา',
      ownerPercent: 75,
      tapperPercent: 25,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M024',
      name: 'นายสมชาย ขยัน',
      phone: '084-567-8902',
      address: 'สวนยาง ต.เทพา อ.เทพา จ.สงขลา',
      ownerPercent: 90,
      tapperPercent: 10,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M025',
      name: 'นางสมศรี ใจดี',
      phone: '085-678-9013',
      address: 'สวนยาง ต.สะบ้าย้อย อ.สะบ้าย้อย จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M026',
      name: 'นายสมศักดิ์ สมบูรณ์',
      phone: '086-789-0124',
      address: 'สวนยาง ต.ระโนด อ.ระโนด จ.สงขลา',
      ownerPercent: 65,
      tapperPercent: 35,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M027',
      name: 'นางสาวสมพร ใจงาม',
      phone: '087-890-1235',
      address: 'สวนยาง ต.กระแสสินธุ์ อ.กระแสสินธุ์ จ.สงขลา',
      ownerPercent: 85,
      tapperPercent: 15,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M028',
      name: 'นายสมชาย รักษ์ดี',
      phone: '088-901-2346',
      address: 'สวนยาง ต.เกาะยอ อ.เมือง จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M029',
      name: 'นางสมศรี ขยัน',
      phone: '089-012-3457',
      address: 'สวนยาง ต.คลองแงะ อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M030',
      name: 'นายสมศักดิ์ ใจดี',
      phone: '090-123-4568',
      address: 'สวนยาง ต.คลองหลา อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 80,
      tapperPercent: 20,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M031',
      name: 'นางสาวสมพร สมบูรณ์',
      phone: '091-234-5679',
      address: 'สวนยาง ต.คลองหอยโข่ง อ.คลองหอยโข่ง จ.สงขลา',
      ownerPercent: 75,
      tapperPercent: 25,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M032',
      name: 'นายสมชาย ใจงาม',
      phone: '092-345-6780',
      address: 'สวนยาง ต.ควนเนียง อ.ควนเนียง จ.สงขลา',
      ownerPercent: 90,
      tapperPercent: 10,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M033',
      name: 'นางสมศรี รักษ์ดี',
      phone: '093-456-7891',
      address: 'สวนยาง ต.รัตภูมิ อ.รัตภูมิ จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M034',
      name: 'นายสมศักดิ์ ขยัน',
      phone: '094-567-8902',
      address: 'สวนยาง ต.สะเดา อ.สะเดา จ.สงขลา',
      ownerPercent: 65,
      tapperPercent: 35,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M035',
      name: 'นางสาวสมพร ใจดี',
      phone: '095-678-9013',
      address: 'สวนยาง ต.จะนะ อ.จะนะ จ.สงขลา',
      ownerPercent: 85,
      tapperPercent: 15,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M036',
      name: 'นายสมชาย สมบูรณ์',
      phone: '096-789-0124',
      address: 'สวนยาง ต.นาทวี อ.นาทวี จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M037',
      name: 'นางสมศรี ใจงาม',
      phone: '097-890-1235',
      address: 'สวนยาง ต.เทพา อ.เทพา จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M038',
      name: 'นายสมศักดิ์ รักษ์ดี',
      phone: '098-901-2346',
      address: 'สวนยาง ต.สะบ้าย้อย อ.สะบ้าย้อย จ.สงขลา',
      ownerPercent: 80,
      tapperPercent: 20,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M039',
      name: 'นางสาวสมพร ขยัน',
      phone: '099-012-3457',
      address: 'สวนยาง ต.ระโนด อ.ระโนด จ.สงขลา',
      ownerPercent: 75,
      tapperPercent: 25,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M040',
      name: 'นายสมชาย ใจดี',
      phone: '080-123-4568',
      address: 'สวนยาง ต.กระแสสินธุ์ อ.กระแสสินธุ์ จ.สงขลา',
      ownerPercent: 90,
      tapperPercent: 10,
      tapperName: 'นายสมพร คนตัด',
    },
    // Generate remaining members programmatically
    ...Array.from({ length: 60 }, (_, i) => {
      const memberNum = i + 41;
      const code = `M${memberNum.toString().padStart(3, '0')}`;
      const names = ['นายสมชาย', 'นางสมศรี', 'นายสมศักดิ์', 'นางสาวสมพร'];
      const surnames = ['ใจดี', 'รักษ์ดี', 'ขยัน', 'ใจงาม', 'สมบูรณ์'];
      const districts = ['บ้านใหม่', 'ท่าช้าง', 'คลองแห', 'คลองอู่ตะเภา', 'คลองหอยโข่ง', 'ควนเนียง', 'รัตภูมิ', 'สะเดา', 'จะนะ', 'นาทวี', 'เทพา', 'สะบ้าย้อย', 'ระโนด', 'กระแสสินธุ์', 'เกาะยอ', 'คลองแงะ', 'คลองหลา'];
      const amphoes = ['เมือง', 'หาดใหญ่', 'คลองหอยโข่ง', 'ควนเนียง', 'รัตภูมิ', 'สะเดา', 'จะนะ', 'นาทวี', 'เทพา', 'สะบ้าย้อย', 'ระโนด', 'กระแสสินธุ์'];
      
      const name = names[i % names.length];
      const surname = surnames[i % surnames.length];
      const district = districts[i % districts.length];
      const amphoe = amphoes[i % amphoes.length];
      
      const phoneBase = 800000000 + (i * 1111111);
      const phone = `0${phoneBase.toString().slice(1, 4)}-${phoneBase.toString().slice(4, 7)}-${phoneBase.toString().slice(7)}`;
      
      const ownerPercent = [60, 65, 70, 75, 80, 85, 90, 100][i % 8];
      const tapperPercent = ownerPercent === 100 ? 0 : 100 - ownerPercent;
      
      const tapperNames = ['นายสมชาย คนตัด', 'นายสมศักดิ์ คนตัด', 'นายสมพร คนตัด', 'นายสมพงษ์ คนตัด'];
      const tapperName = ownerPercent === 100 ? undefined : tapperNames[i % tapperNames.length];
      
      return {
        code,
        name: `${name} ${surname}`,
        phone,
        address: `สวนยาง ต.${district} อ.${amphoe} จ.สงขลา`,
        ownerPercent,
        tapperPercent,
        tapperName,
      };
    }),
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

