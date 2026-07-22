/**
 * Seed 100,000 sample Sale rows into the existing database.
 * Run after main seed (needs at least one User and ProductType):
 *   npx tsx prisma/seedSale.ts
 *   npm run db:seed:sales
 *
 * Clears existing sales first, then inserts fresh records (no stock/ledger updates).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SELLING_TYPES = ['จ่ายสด', 'ขายล่วง', 'ฝาก'] as const;
const EXPENSE_TYPES = ['ค่าขนส่ง', 'ค่าแรง', 'ค่าบริการ', 'อื่นๆ'];
const COMPANY_NAMES = [
  'บริษัท ยางไทย จำกัด',
  'ห้างหุ้นส่วนจำกัด รับซื้อยางใต้',
  'บริษัท แปรรูปยางภาคใต้ จำกัด',
  'บริษัท ส่งออกยางพารา จำกัด',
  'โรงงานแปรรูปยางสงขลา',
  'บริษัท ลาเท็กซ์โปร จำกัด',
  'หจก. ค้ายางคลองแห',
  'บริษัท ยางคุณภาพ จำกัด',
  'ศูนย์รวมยางภาคใต้',
  'บริษัท เอเชียน รับเบอร์ จำกัด',
];

const SALE_COUNT = 100_000;
const BATCH_SIZE = 1_000;

async function main() {
  console.log('🧾 seedSale: สร้างรายการขายตัวอย่าง...');

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });
  const productTypes = await prisma.productType.findMany({
    orderBy: { code: 'asc' },
  });

  if (users.length === 0) {
    console.error('❌ ไม่พบผู้ใช้ในระบบ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }
  if (productTypes.length === 0) {
    console.error('❌ ไม่พบประเภทสินค้า — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  // Ensure destination companies exist for COMPANY_NAMES
  const companyIds: string[] = [];
  for (let i = 0; i < COMPANY_NAMES.length; i++) {
    const name = COMPANY_NAMES[i];
    const code = `C${String(i + 1).padStart(3, '0')}`;
    const existing = await prisma.destinationCompany.findFirst({
      where: { name },
    });
    if (existing) {
      companyIds.push(existing.id);
    } else {
      const created = await prisma.destinationCompany.create({
        data: { code, name },
      });
      companyIds.push(created.id);
    }
  }

  const deleted = await prisma.sale.deleteMany({});
  console.log(`   - ลบรายการขายเดิม: ${deleted.count} รายการ`);

  const usersForSales = users.slice(0, Math.min(3, users.length));
  let createdCount = 0;

  for (let i = 0; i < SALE_COUNT; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, SALE_COUNT);
    const batchData = [];

    for (let j = i; j < batchEnd; j++) {
      const productType = productTypes[j % productTypes.length];
      const recordUser = usersForSales[j % usersForSales.length];

      // Spread across last 365 days
      const date = new Date();
      date.setDate(date.getDate() - (j % 365));
      date.setHours(7 + (j % 12), (j * 13) % 60, (j * 7) % 60, 0);

      const weight = parseFloat((80 + ((j * 37) % 4200) + (j % 100) / 100).toFixed(2));
      const pricePerUnit = parseFloat((38 + ((j * 17) % 2200) / 100).toFixed(2));
      const rubberPercent =
        j % 5 === 0 ? null : parseFloat((55 + (j % 15) + (j % 80) / 10).toFixed(2));

      const hasExpense = j % 4 !== 0;
      const expenseType = hasExpense ? EXPENSE_TYPES[j % EXPENSE_TYPES.length] : null;
      const expenseCost = hasExpense
        ? parseFloat((50 + (j % 20) * 25 + (j % 200)).toFixed(2))
        : null;
      const rawTotal = weight * pricePerUnit - (expenseCost ?? 0);
      const totalAmount = parseFloat((rawTotal > 0 ? rawTotal : weight * pricePerUnit).toFixed(2));

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const seq = (j + 1).toString().padStart(6, '0');
      const saleNo = `SAL-${year}${month}-${seq}`;

      batchData.push({
        saleNo,
        date,
        createdAt: date,
        userId: recordUser.id,
        companyName: COMPANY_NAMES[j % COMPANY_NAMES.length],
        destinationCompanyId: companyIds[j % companyIds.length],
        productTypeId: productType.id,
        weight,
        rubberPercent,
        pricePerUnit,
        expenseType,
        expenseCost,
        sellingType: SELLING_TYPES[j % SELLING_TYPES.length],
        totalAmount,
        notes:
          hasExpense && j % 3 === 0
            ? `หมายเหตุค่าใช้จ่ายรายการที่ ${j + 1}`
            : null,
      });
    }

    try {
      const result = await prisma.sale.createMany({ data: batchData });
      createdCount += result.count;
    } catch (error) {
      console.log(`   ⚠️  ข้ามรุ่น ${i + 1}–${batchEnd}:`, error);
    }

    console.log(`   ✓ สร้างการขายครบ ${batchEnd} / ${SALE_COUNT} รายการ`);
  }

  console.log('✅ seedSale เสร็จ: สร้างรายการขาย', createdCount, 'รายการ');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
