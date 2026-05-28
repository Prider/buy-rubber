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
  await prisma.serviceFee.deleteMany({});
  console.log('   - ลบข้อมูลค่าบริการ');
  
  await prisma.purchase.deleteMany({});
  console.log('   - ลบข้อมูลการรับซื้อ');
  
  await prisma.productPrice.deleteMany({});
  console.log('   - ลบราคาสินค้าประจำวัน');
  await prisma.expense.deleteMany({});
  console.log('   - ลบค่าใช้จ่าย');
  
  // ลบข้อมูลหลักหลังจากลบข้อมูลที่อ้างอิงแล้ว
  await prisma.stockLedgerEntry.deleteMany({});
  console.log('   - ลบรายการสต็อก');

  await prisma.stockPosition.deleteMany({});
  console.log('   - ลบตำแหน่งสต็อก');

  await prisma.sale.deleteMany({});
  console.log('   - ลบข้อมูลการขาย');

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
  
  console.log('✅ สร้างผู้ใช้งาน:');
  console.log('   - Admin:', admin.username, '(Full access)');
  console.log('   - Admin Two:', adminTwo.username, '(Full access)');
  console.log('   - User:', user.username, '(Edit access)');
  console.log('   - Viewer:', viewer.username, '(Read-only)');

  // สร้างประเภทสินค้า
  const productTypes = await Promise.all([
    prisma.productType.create({
      data: {
        code: 'RUBER1',
        name: 'ยางจอก',
        description: 'ยางจอก',
      },
    }),
    prisma.productType.create({
      data: {
        code: 'RUBER2',
        name: 'ยางก้อน',
        description: 'ยางก้อน',
      },
    }),
    prisma.productType.create({
      data: {
        code: 'RUBER3',
        name: 'ยางพรก',
        description: 'ยางพรก',
      },
    }),
    prisma.productType.create({
      data: {
        code: 'RUBER4',
        name: 'ยางเส้น',
        description: 'ยางเส้น',
      },
    }),
    prisma.productType.create({
      data: {
        code: 'RUBER5',
        name: 'ยางแผ่น',
        description: 'ยางแผ่น',
      },
    }),
  ]);
  console.log('✅ สร้างประเภทสินค้า:', productTypes.length, 'ประเภท');

  // สร้างค่าใช้จ่ายตัวอย่าง
  console.log('💸 สร้างข้อมูลค่าใช้จ่าย...');
  const expenseCategories = [
    { category: 'ค่าน้ำมัน', description: 'ทดสอบ ค่าน้ำมันรถรับซื้อยาง', baseAmount: 1200 },
    { category: 'ค่าซ่อมบำรุง', description: 'ทดสอบ ค่าบำรุงรักษารถและเครื่องมือ', baseAmount: 850 },
    { category: 'ค่าคนงาน', description: 'ทดสอบ ค่าแรงทีมงานประจำวัน', baseAmount: 1500 },
    { category: 'ค่าไฟฟ้า', description: 'ทดสอบ ค่าไฟฟ้าโรงรับซื้อยาง', baseAmount: 600 },
    { category: 'ค่าเดินทาง', description: 'ทดสอบ ค่าเดินทางไปตรวจสวนยาง', baseAmount: 700 },
  ];

  const expenses = [];
  const expenseCount = 5;
  
  // Get users for assigning to expenses (alternate between admin and user)
  const usersForExpenses = [admin, adminTwo, user];
  const getUserForExpense = (index: number) => usersForExpenses[index % usersForExpenses.length];

  for (let i = 0; i < expenseCount; i++) {
    const categoryInfo = expenseCategories[i % expenseCategories.length];
    const assignedUser = getUserForExpense(i);

    const date = new Date();
    date.setDate(date.getDate() - (i % 45));
    date.setHours(12, 0, 0, 0);

    const expenseNo = `EXP-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`;
    const amount = parseFloat((categoryInfo.baseAmount + ((i % 7) * 37)).toFixed(2));
    const descriptionSuffix = i % 3 === 0 ? ' (รอบเช้า)' : i % 3 === 1 ? ' (รอบบ่าย)' : ' (รอบเย็น)';

    const expense = await prisma.expense.create({
      data: {
        expenseNo,
        date,
        createdAt: date,
        category: categoryInfo.category,
        amount,
        description: `${categoryInfo.description}${descriptionSuffix}`,
        userId: assignedUser.id,
        userName: assignedUser.username,
      },
    });

    expenses.push(expense);

    if ((i + 1) % 20 === 0) {
      console.log(`   ✓ สร้างค่าใช้จ่ายครบ ${(i + 1)} รายการ`);
    }
  }
  console.log('✅ สร้างค่าใช้จ่าย:', expenses.length, 'รายการ');

  // สร้างสมาชิกตัวอย่าง (1000 ราย)
  console.log('👥 สร้างสมาชิกตัวอย่าง (10 ราย)...');

  const baseMembers = [
    {
      code: 'M001',
      name: 'นายสมชาย ใจดี ตัวอย่างที่ 1',
      phone: '0812345678',
      address: 'สวนยาง ต.บ้านใหม่ อ.เมือง จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M002',
      name: 'นางสาวสมหญิง รักษ์ดี ตัวอย่างที่ 2',
      phone: '0823456789',
      address: 'สวนยาง ต.ท่าช้าง อ.เมือง จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M003',
      name: 'นายประยุทธ์ ขยัน ตัวอย่างที่ 3',
      phone: '0834567890',
      address: 'สวนยาง ต.คลองแห อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 60,
      tapperPercent: 40,
      tapperName: 'นายสมพงษ์ คนตัด',
    },
    {
      code: 'M004',
      name: 'นายวิศาล สมบูรณ์ ตัวอย่างที่ 4',
      phone: '0845678901',
      address: 'สวนยาง ต.คลองอู่ตะเภา อ.หาดใหญ่ จ.สงขลา',
      ownerPercent: 80,
      tapperPercent: 20,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M005',
      name: 'นางสมศรี ใจงาม ตัวอย่างที่ 5',
      phone: '0856789012',
      address: 'สวนยาง ต.คลองหอยโข่ง อ.คลองหอยโข่ง จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M006',
      name: 'นายสมศักดิ์ รักษ์ดี ตัวอย่างที่ 6',
      phone: '0867890123',
      address: 'สวนยาง ต.ควนเนียง อ.ควนเนียง จ.สงขลา',
      ownerPercent: 65,
      tapperPercent: 35,
      tapperName: 'นายสมชาย คนตัด',
    },
    {
      code: 'M007',
      name: 'นางสาวสมพร ใจดี ตัวอย่างที่ 7',
      phone: '0878901234',
      address: 'สวนยาง ต.รัตภูมิ อ.รัตภูมิ จ.สงขลา',
      ownerPercent: 75,
      tapperPercent: 25,
      tapperName: 'นายสมศักดิ์ คนตัด',
    },
    {
      code: 'M008',
      name: 'นายสมชาย รักษ์ดี ตัวอย่างที่ 8',
      phone: '0889012345',
      address: 'สวนยาง ต.สะเดา อ.สะเดา จ.สงขลา',
      ownerPercent: 90,
      tapperPercent: 10,
      tapperName: 'นายสมพร คนตัด',
    },
    {
      code: 'M009',
      name: 'นางสมปอง สุขดี ตัวอย่างที่ 9',
      phone: '0890123456',
      address: 'สวนยาง ต.จะนะ อ.จะนะ จ.สงขลา',
      ownerPercent: 100,
      tapperPercent: 0,
    },
    {
      code: 'M010',
      name: 'นายสมศักดิ์ ขยัน ตัวอย่างที่ 10',
      phone: '0901234567',
      address: 'สวนยาง ต.นาทวี อ.นาทวี จ.สงขลา',
      ownerPercent: 70,
      tapperPercent: 30,
      tapperName: 'นายสมชาย คนตัด',
    },
  ];

  const ownerPercentOptions = [70, 80, 60, 90, 65, 75, 85, 100];
  const districts = [
    'บ้านใหม่',
    'ท่าช้าง',
    'คลองแห',
    'คลองอู่ตะเภา',
    'คลองหอยโข่ง',
    'ควนเนียง',
    'รัตภูมิ',
    'สะเดา',
    'จะนะ',
    'นาทวี',
  ];

  const totalMembers = 10;
  const memberData = Array.from({ length: totalMembers }, (_value, idx) => {
    if (idx < baseMembers.length) {
      return baseMembers[idx];
    }

    const codeNumber = idx + 1; // 1-based
    const code = `M${codeNumber.toString().padStart(4, '0')}`;
    const ownerPercent = ownerPercentOptions[idx % ownerPercentOptions.length];
    const tapperPercent = Math.max(0, 100 - ownerPercent);
    const phone = `08${(10000000 + idx).toString().slice(-8)}`;
    const district = districts[idx % districts.length];
    const address = `บ้านเลขที่ ${idx + 1} หมู่ ${(idx % 10) + 1} ต.${district} อ.เมือง จ.สงขลา`;
    const tapperName = `นายคนตัด ${(idx % 200 + 1).toString().padStart(3, '0')}`;

    return {
      code,
      name: `สมาชิกทดสอบ ${code}`,
      phone,
      address,
      ownerPercent,
      tapperPercent,
      tapperName,
    };
  });

  // Create members in batches to avoid overwhelming the database
  const members = [];
  const batchSize = 100;
  
  for (let i = 0; i < memberData.length; i += batchSize) {
    const batch = memberData.slice(i, i + batchSize);
    const batchMembers = await Promise.all(
      batch.map(data => prisma.member.create({ data }))
    );
    members.push(...batchMembers);
    console.log(`   ✓ สร้างสมาชิกรุ่นที่ ${Math.floor(i/batchSize) + 1}: ${batchMembers.length} ราย`);
  }
  console.log('✅ สร้างสมาชิก:', members.length, 'ราย');

  // Helper function to generate document number with counter to avoid duplicates

  // สร้างการรับซื้อตัวอย่างเพื่อเชื่อมกับค่าบริการ
  console.log('🛒 สร้างการรับซื้อตัวอย่าง...');
  const purchases: { purchaseNo: string }[] = [];
  const purchaseCount = 4000;
  const purchaseBatchSize = 200;

  for (let i = 0; i < purchaseCount; i += purchaseBatchSize) {
    const batchEnd = Math.min(i + purchaseBatchSize, purchaseCount);
    const batchData = [];

    for (let j = i; j < batchEnd; j++) {
      const member = members[j % members.length];
      const productType = productTypes[j % productTypes.length];
      const randomUser = [admin, user][j % 2]; // Alternate between admin and user

      // Spread across last 365 days so the app has realistic historical data
      const date = new Date();
      date.setDate(date.getDate() - (j % 365));
      date.setHours(8 + (j % 12), (j * 7) % 60, 0, 0);

      const grossWeight = 50 + Math.random() * 100;
      const containerWeight = 2 + Math.random() * 5;
      const netWeight = grossWeight - containerWeight;
      const basePrice = productType.code === 'FRESH' ? 50 : productType.code === 'DRY' ? 45 : 30;
      const finalPrice = basePrice + (Math.random() * 5);
      const totalAmount = netWeight * finalPrice;

      const ownerAmount = (totalAmount * member.ownerPercent) / 100;
      const tapperAmount = (totalAmount * member.tapperPercent) / 100;

      // Use a sequential index as the doc-number suffix to avoid collisions
      // during rapid bulk inserts (Date.now() collides when many records are
      // created within the same millisecond).
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const seq = (j + 1).toString().padStart(6, '0');
      const purchaseNo = `PUR-${year}${month}-${seq}`;

      batchData.push({
        purchaseNo,
        date,
        createdAt: date,
        memberId: member.id,
        productTypeId: productType.id,
        userId: randomUser.id,
        grossWeight: parseFloat(grossWeight.toFixed(2)),
        containerWeight: parseFloat(containerWeight.toFixed(2)),
        netWeight: parseFloat(netWeight.toFixed(2)),
        dryWeight: parseFloat(netWeight.toFixed(2)),
        basePrice: parseFloat(basePrice.toFixed(2)),
        adjustedPrice: parseFloat(finalPrice.toFixed(2)),
        bonusPrice: 0,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        ownerAmount: parseFloat(ownerAmount.toFixed(2)),
        tapperAmount: parseFloat(tapperAmount.toFixed(2)),
        isPaid: false,
      });
    }

    try {
      const result = await prisma.purchase.createMany({
        data: batchData,
        skipDuplicates: true,
      });
      purchases.push(...batchData.slice(0, result.count));
    } catch (_error) {
      console.log(`   ⚠️  ข้ามรุ่น ${i + 1}–${batchEnd}`);
    }

    console.log(`   ✓ สร้างการรับซื้อครบ ${batchEnd} / ${purchaseCount} รายการ`);
  }
  console.log('✅ สร้างการรับซื้อ:', purchases.length, 'รายการ');

  // // สร้างค่าบริการตัวอย่าง (100+ รายการ)
  // console.log('💰 สร้างค่าบริการตัวอย่าง...');
  
  // const serviceFeeCategories = [
  //   { category: 'ค่าขนส่ง', baseAmount: 200 },
  //   { category: 'ค่าบรรจุภัณฑ์', baseAmount: 150 },
  //   { category: 'ค่าการตรวจสอบ', baseAmount: 100 },
  //   { category: 'ค่าบริการอื่นๆ', baseAmount: 80 },
  //   { category: 'ค่าธรรมเนียม', baseAmount: 50 },
  //   { category: 'ค่าใช้จ่ายเพิ่มเติม', baseAmount: 120 },
  // ];
  
  // const serviceFees = [];
  // const serviceFeeCount = 10; // Create 120 service fees for testing
  
  // for (let i = 0; i < serviceFeeCount; i++) {
  //   const categoryInfo = serviceFeeCategories[i % serviceFeeCategories.length];
    
  //   // Create dates spread over last 60 days
  //   const date = new Date();
  //   date.setDate(date.getDate() - (i % 60));
  //   // Vary times throughout the day
  //   const hour = 7 + Math.floor((i * 13) % 15); // 7 AM to 9 PM
  //   const minute = (i * 17) % 60;
  //   date.setHours(hour, minute, (i * 23) % 60, (i * 37) % 1000);
    
  //   const serviceFeeNo = await generateDocumentNumberUtil('SVC', date);
    
  //   // Link 100% to purchases - always use actual purchaseNo from created purchases
  //   let purchaseNo: string | null = null;
    
  //   if (purchases.length > 0) {
  //     // Use actual purchase number from an existing purchase
  //     const linkedPurchase = purchases[i % purchases.length];
  //     purchaseNo = linkedPurchase.purchaseNo; // Use the actual purchaseNo from the purchase
  //   }
    
  //   const amount = parseFloat((categoryInfo.baseAmount + (Math.random() * 100)).toFixed(2));
  //   const notes = i % 3 === 0 ? `หมายเหตุ ${i + 1}` : null;
    
  //   try {
  //     const serviceFee = await prisma.serviceFee.create({
  //       data: {
  //         serviceFeeNo,
  //         purchaseNo: purchaseNo, // Use actual purchaseNo from created purchase, or null
  //         date,
  //         createdAt: date,
  //         category: categoryInfo.category,
  //         amount,
  //         notes,
  //       },
  //     });
  //     serviceFees.push(serviceFee);
  //   } catch (_error) {
  //     // Skip if duplicate
  //     console.log(`   ⚠️  ข้ามค่าบริการ ${serviceFeeNo}`);
  //   }
    
  //   if ((i + 1) % 30 === 0) {
  //     console.log(`   ✓ สร้างค่าบริการครบ ${i + 1} รายการ`);
  //   }
  // }
  // console.log('✅ สร้างค่าบริการ:', serviceFees.length, 'รายการ');
  // console.log(`   - เชื่อมกับ purchase: ${serviceFees.filter(sf => sf.purchaseNo).length} รายการ (100%)`);

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
  console.log('  👤 Admin Account (Full access):');
  console.log('     Username: mayrin');
  console.log('     Password: mayrin123');
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

