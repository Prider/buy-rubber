/**
 * Seed 100,000 sample Purchase rows into the existing database.
 * Run after main seed (needs at least one User, Member, and ProductType):
 *   npx tsx prisma/seedPurchase.ts
 *   npm run db:seed:purchases
 *
 * Clears existing purchases and linked service fees first, then inserts fresh
 * records (no stock/ledger updates).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PURCHASE_COUNT = 100_000;
const BATCH_SIZE = 1_000;

async function main() {
  console.log('🛒 seedPurchase: สร้างรายการรับซื้อตัวอย่าง...');

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });
  const members = await prisma.member.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });
  const productTypes = await prisma.productType.findMany({
    orderBy: { code: 'asc' },
  });

  if (users.length === 0) {
    console.error('❌ ไม่พบผู้ใช้ในระบบ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }
  if (members.length === 0) {
    console.error('❌ ไม่พบสมาชิกในระบบ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }
  if (productTypes.length === 0) {
    console.error('❌ ไม่พบประเภทสินค้า — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  const deletedFees = await prisma.serviceFee.deleteMany({});
  console.log(`   - ลบค่าบริการที่เชื่อมกับรับซื้อ: ${deletedFees.count} รายการ`);

  const deleted = await prisma.purchase.deleteMany({});
  console.log(`   - ลบรายการรับซื้อเดิม: ${deleted.count} รายการ`);

  const usersForPurchases = users.slice(0, Math.min(3, users.length));
  let createdCount = 0;

  for (let i = 0; i < PURCHASE_COUNT; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, PURCHASE_COUNT);
    const batchData = [];

    for (let j = i; j < batchEnd; j++) {
      const member = members[j % members.length];
      const productType = productTypes[j % productTypes.length];
      const recordUser = usersForPurchases[j % usersForPurchases.length];

      // Spread across last 365 days
      const date = new Date();
      date.setDate(date.getDate() - (j % 365));
      date.setHours(7 + (j % 12), (j * 13) % 60, (j * 7) % 60, 0);

      const grossWeight = parseFloat((50 + ((j * 41) % 5000) + (j % 100) / 100).toFixed(2));
      const containerWeight = parseFloat((2 + (j % 8) + (j % 50) / 100).toFixed(2));
      const netWeight = parseFloat((grossWeight - containerWeight).toFixed(2));
      const basePrice = parseFloat((38 + ((j * 19) % 1800) / 100).toFixed(2));
      const adjustedPrice = parseFloat((basePrice + (j % 50) / 10).toFixed(2));
      const bonusPrice = j % 7 === 0 ? parseFloat(((j % 5) + 0.5).toFixed(2)) : 0;
      const finalPrice = parseFloat((adjustedPrice + bonusPrice).toFixed(2));
      const totalAmount = parseFloat((netWeight * finalPrice).toFixed(2));
      const ownerAmount = parseFloat(((totalAmount * member.ownerPercent) / 100).toFixed(2));
      const tapperAmount = parseFloat(((totalAmount * member.tapperPercent) / 100).toFixed(2));

      const rubberPercent =
        j % 4 === 0 ? null : parseFloat((55 + (j % 15) + (j % 80) / 10).toFixed(2));
      const dryWeight = parseFloat(
        (rubberPercent != null ? netWeight * (rubberPercent / 100) : netWeight).toFixed(2)
      );

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
        userId: recordUser.id,
        grossWeight,
        containerWeight,
        netWeight,
        rubberPercent,
        dryWeight,
        basePrice,
        adjustedPrice,
        bonusPrice,
        finalPrice,
        totalAmount,
        ownerAmount,
        tapperAmount,
        isPaid: j % 5 === 0,
        notes: j % 6 === 0 ? `หมายเหตุรายการที่ ${j + 1}` : null,
      });
    }

    try {
      const result = await prisma.purchase.createMany({ data: batchData });
      createdCount += result.count;
    } catch (error) {
      console.log(`   ⚠️  ข้ามรุ่น ${i + 1}–${batchEnd}:`, error);
    }

    console.log(`   ✓ สร้างการรับซื้อครบ ${batchEnd} / ${PURCHASE_COUNT} รายการ`);
  }

  console.log('✅ seedPurchase เสร็จ: สร้างรายการรับซื้อ', createdCount, 'รายการ');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
