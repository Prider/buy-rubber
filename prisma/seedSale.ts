/**
 * Seed 100 sample Sale rows into the existing database.
 * Run after main seed (or whenever you have at least one User and ProductType):
 *   npx tsx prisma/seedSale.ts
 *   npm run db:seed:sales
 */
import { PrismaClient } from '@prisma/client';
import { generateDocumentNumber as generateDocumentNumberUtil } from '@/lib/utils';

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

const SALE_COUNT = 100;

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
    console.error('❌ ไม่พบผู้ใช้ในระบบ — รัน prisma/seed.ts ก่อน');
    process.exit(1);
  }
  if (productTypes.length === 0) {
    console.error('❌ ไม่พบประเภทสินค้า — รัน prisma/seed.ts ก่อน');
    process.exit(1);
  }

  // Prefer staff who can record sales (rotate first few users)
  const usersForSales = users.slice(0, Math.min(3, users.length));

  const created: string[] = [];

  for (let i = 0; i < SALE_COUNT; i++) {
    const productType = productTypes[i % productTypes.length];
    const recordUser = usersForSales[i % usersForSales.length];

    const date = new Date();
    date.setDate(date.getDate() - (i % 120));
    const hour = 7 + Math.floor((i * 11) % 14);
    const minute = (i * 13) % 60;
    date.setHours(hour, minute, (i * 7) % 60, (i * 17) % 1000);

    const weight = parseFloat((80 + Math.random() * 4200).toFixed(2));
    const pricePerUnit = parseFloat((38 + Math.random() * 22).toFixed(2));
    const rubberPercent =
      i % 5 === 0 ? null : parseFloat((55 + (i % 15) + Math.random() * 8).toFixed(2));

    const hasExpense = i % 4 !== 0;
    const expenseType = hasExpense ? EXPENSE_TYPES[i % EXPENSE_TYPES.length] : null;
    const expenseCost = hasExpense
      ? parseFloat((50 + (i % 20) * 25 + Math.random() * 200).toFixed(2))
      : null;
    const totalAmount = parseFloat((weight * pricePerUnit - (expenseCost ?? 0)).toFixed(2));

    const saleNo = await generateDocumentNumberUtil('SAL', date);

    try {
      await prisma.sale.create({
        data: {
          saleNo,
          date,
          createdAt: date,
          userId: recordUser.id,
          companyName: COMPANY_NAMES[i % COMPANY_NAMES.length],
          productTypeId: productType.id,
          weight,
          rubberPercent,
          pricePerUnit,
          expenseType,
          expenseCost,
          sellingType: SELLING_TYPES[i % SELLING_TYPES.length],
          totalAmount:
            totalAmount > 0 ? totalAmount : parseFloat((weight * pricePerUnit).toFixed(2)),
          notes:
            hasExpense && i % 3 === 0
              ? `หมายเหตุค่าใช้จ่ายรายการที่ ${i + 1}`
              : null,
        },
      });
      created.push(saleNo);
    } catch (_error) {
      console.log(`   ⚠️  ข้ามรายการขาย (เลขซ้ำหรือข้อผิดพลาด): ${saleNo}`);
    }

    if ((i + 1) % 25 === 0) {
      console.log(`   ✓ ประมวลผล ${i + 1}/${SALE_COUNT} รายการ (สร้างสำเร็จ ${created.length})`);
    }
  }

  console.log('✅ seedSale เสร็จ: สร้างรายการขาย', created.length, 'รายการ');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
