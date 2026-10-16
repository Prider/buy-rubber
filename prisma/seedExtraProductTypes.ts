/**
 * Adds 10 product types plus one purchase today for each,
 * so they show on the dashboard product row.
 * Safe to re-run: types are upserted by code, purchases use fixed numbers.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;

const EXTRA_TYPES = [
  { code: 'RUBER6', name: 'น้ำยางสด' },
  { code: 'RUBER7', name: 'ยางแห้ง' },
  { code: 'RUBER8', name: 'เศษยาง' },
  { code: 'RUBER9', name: 'ยางเครป' },
  { code: 'RUBER10', name: 'ยางแท่ง' },
  { code: 'RUBER11', name: 'ยางแผ่นดิบ' },
  { code: 'RUBER12', name: 'ยางแผ่นรมควัน' },
  { code: 'RUBER13', name: 'ขี้ยาง' },
  { code: 'RUBER14', name: 'ยางก้อน02' },
  { code: 'RUBER15', name: 'ยางจอก02' },
] as const;

function thailandDayStart(daysAgo: number): Date {
  const shifted = new Date(Date.now() + THAILAND_OFFSET_MS);
  const start = new Date(Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - daysAgo,
    0, 0, 0, 0,
  ));
  start.setTime(start.getTime() - THAILAND_OFFSET_MS);
  return start;
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  const member = await prisma.member.findFirst({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });
  if (!user || !member) {
    throw new Error('Need an active user and member before adding test product types');
  }

  const todayStart = thailandDayStart(0);
  const created: string[] = [];

  for (let index = 0; index < EXTRA_TYPES.length; index += 1) {
    const sample = EXTRA_TYPES[index];
    const productType = await prisma.productType.upsert({
      where: { code: sample.code },
      update: { name: sample.name, isActive: true },
      create: {
        code: sample.code,
        name: sample.name,
        description: 'ข้อมูลทดสอบ',
        isActive: true,
      },
    });

    const dryWeight = 80 + index * 15;
    const pricePerKg = 40 + index;
    const totalAmount = Math.round(dryWeight * pricePerKg * 100) / 100;
    const purchaseNo = `TEST-PT-${sample.code}`;
    const date = new Date(todayStart.getTime() + (9 * 60 + index * 5) * 60 * 1000);

    const existing = await prisma.purchase.findFirst({ where: { purchaseNo } });
    if (!existing) {
      await prisma.purchase.create({
        data: {
          purchaseNo,
          date,
          createdAt: date,
          memberId: member.id,
          productTypeId: productType.id,
          userId: user.id,
          grossWeight: dryWeight + 5,
          containerWeight: 5,
          netWeight: dryWeight,
          dryWeight,
          basePrice: pricePerKg,
          adjustedPrice: pricePerKg,
          bonusPrice: 0,
          finalPrice: pricePerKg,
          totalAmount,
          ownerAmount: totalAmount,
          tapperAmount: 0,
          isPaid: true,
        },
      });
    }

    created.push(`${productType.code} ${productType.name} ${dryWeight} กก.`);
  }

  console.log(`Added ${created.length} product types for testing:`);
  for (const line of created) console.log(`  ${line}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
