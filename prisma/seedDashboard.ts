/**
 * Sample rows for the interactive dashboard.
 * Adds purchases, sales, prices, expenses, and service fees for today
 * and the previous six Thailand days. Re-running replaces only rows
 * whose numbers start with DASH-.
 *
 *   npx tsx prisma/seedDashboard.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
const PREFIX = 'DASH-';

const MEMBER_SAMPLES = [
  { code: 'DASH-M01', name: 'สมชาย วิชัย', phone: '0811111111' },
  { code: 'DASH-M02', name: 'มาลี แก้ว', phone: '0822222222' },
  { code: 'DASH-M03', name: 'ประเทศ ยาง', phone: '0833333333' },
  { code: 'DASH-M04', name: 'สุดา สวน', phone: '0844444444' },
];

const COMPANIES = ['บริษัท ยางไทย จำกัด', 'โรงงานแปรรูปยางสงขลา', 'หจก. ค้ายางคลองแห'];

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

function atHour(dayStart: Date, hour: number, minute: number): Date {
  return new Date(dayStart.getTime() + (hour * 60 + minute) * 60 * 1000);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  const productTypes = await prisma.productType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  if (!user) {
    console.error('ไม่พบผู้ใช้ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }
  if (productTypes.length === 0) {
    console.error('ไม่พบประเภทสินค้า — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  const members = [];
  for (const sample of MEMBER_SAMPLES) {
    const existing = await prisma.member.findUnique({ where: { code: sample.code } });
    members.push(existing ?? await prisma.member.create({ data: sample }));
  }

  await prisma.serviceFee.deleteMany({ where: { serviceFeeNo: { startsWith: PREFIX } } });
  await prisma.purchase.deleteMany({ where: { purchaseNo: { startsWith: PREFIX } } });
  await prisma.sale.deleteMany({ where: { saleNo: { startsWith: PREFIX } } });
  await prisma.expense.deleteMany({ where: { expenseNo: { startsWith: PREFIX } } });

  const pricedTypes = productTypes.slice(0, Math.max(productTypes.length - 1, 1));
  const todayStart = thailandDayStart(0);
  const tomorrow = thailandDayStart(-1);
  let priceCount = 0;
  for (let index = 0; index < pricedTypes.length; index += 1) {
    const productType = pricedTypes[index];
    const existing = await prisma.productPrice.findFirst({
      where: {
        productTypeId: productType.id,
        date: { gte: todayStart, lt: tomorrow },
      },
    });
    const price = 42 + index * 3.5;
    if (existing) {
      await prisma.productPrice.update({ where: { id: existing.id }, data: { price } });
    } else {
      await prisma.productPrice.create({
        data: { productTypeId: productType.id, date: atHour(todayStart, 7, 0), price },
      });
    }
    priceCount += 1;
  }

  const purchasePlan = [
    { daysAgo: 6, rows: [[0, 180], [1, 90]] },
    { daysAgo: 5, rows: [[0, 220], [2, 140]] },
    { daysAgo: 4, rows: [[1, 260], [2, 110], [0, 80]] },
    { daysAgo: 3, rows: [[0, 300]] },
    { daysAgo: 2, rows: [[0, 190], [1, 210], [2, 160]] },
    { daysAgo: 1, rows: [[1, 240], [0, 130]] },
    { daysAgo: 0, rows: [[0, 420], [0, 310], [1, 280], [1, 230], [2, 190], [2, 150]] },
  ] as const;

  let purchaseCount = 0;
  const todayPurchaseNos: string[] = [];
  for (const day of purchasePlan) {
    const dayStart = thailandDayStart(day.daysAgo);
    for (let rowIndex = 0; rowIndex < day.rows.length; rowIndex += 1) {
      const [typeIndex, weight] = day.rows[rowIndex];
      const productType = productTypes[typeIndex % productTypes.length];
      const member = members[(purchaseCount + rowIndex) % members.length];
      const pricePerKg = 42 + (typeIndex % productTypes.length) * 3.5;
      const dryWeight = weight;
      const totalAmount = Math.round(dryWeight * pricePerKg * 100) / 100;
      const purchaseNo = `${PREFIX}P-${day.daysAgo}-${rowIndex + 1}`;
      const date = atHour(dayStart, 8 + rowIndex, 15 + rowIndex * 7);
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
      if (day.daysAgo === 0) todayPurchaseNos.push(purchaseNo);
      purchaseCount += 1;
    }
  }

  const salePlan = [
    { daysAgo: 6, weight: 400 },
    { daysAgo: 4, weight: 620 },
    { daysAgo: 3, weight: 280 },
    { daysAgo: 1, weight: 510 },
    { daysAgo: 0, weight: 800 },
    { daysAgo: 0, weight: 260 },
  ];
  for (let index = 0; index < salePlan.length; index += 1) {
    const plan = salePlan[index];
    const productType = productTypes[index % Math.min(3, productTypes.length)];
    const pricePerUnit = 55 + (index % 3) * 2;
    const date = atHour(thailandDayStart(plan.daysAgo), 13 + (index % 3), 10);
    await prisma.sale.create({
      data: {
        saleNo: `${PREFIX}S-${index + 1}`,
        date,
        createdAt: date,
        userId: user.id,
        companyName: COMPANIES[index % COMPANIES.length],
        productTypeId: productType.id,
        weight: plan.weight,
        pricePerUnit,
        sellingType: 'จ่ายสด',
        totalAmount: Math.round(plan.weight * pricePerUnit * 100) / 100,
      },
    });
  }

  const expenses = [
    { no: `${PREFIX}E-1`, daysAgo: 0, hour: 9, category: 'ค่าน้ำมัน', amount: 1850, description: 'น้ำมันรถรับซื้อ' },
    { no: `${PREFIX}E-2`, daysAgo: 0, hour: 16, category: 'ค่าคนงาน', amount: 2400, description: 'ค่าแรงยกยาง' },
    { no: `${PREFIX}E-3`, daysAgo: 3, hour: 11, category: 'ค่าซ่อมรถ', amount: 3200, description: 'เปลี่ยนยางรถ' },
  ];
  for (const expense of expenses) {
    const date = atHour(thailandDayStart(expense.daysAgo), expense.hour, 20);
    await prisma.expense.create({
      data: {
        expenseNo: expense.no,
        date,
        createdAt: date,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        userId: user.id,
        userName: user.username,
      },
    });
  }

  const fees = [
    { no: `${PREFIX}F-1`, daysAgo: 0, hour: 8, category: 'ค่าชั่ง', amount: 50, purchaseNo: todayPurchaseNos[0] },
    { no: `${PREFIX}F-2`, daysAgo: 0, hour: 10, category: 'ค่าชั่ง', amount: 50, purchaseNo: todayPurchaseNos[1] },
    { no: `${PREFIX}F-3`, daysAgo: 0, hour: 14, category: 'ค่าบริการอื่นๆ', amount: 120, purchaseNo: todayPurchaseNos[2] },
    { no: `${PREFIX}F-4`, daysAgo: 2, hour: 9, category: 'ค่าชั่ง', amount: 40, purchaseNo: null },
  ];
  for (const fee of fees) {
    const date = atHour(thailandDayStart(fee.daysAgo), fee.hour, 5);
    await prisma.serviceFee.create({
      data: {
        serviceFeeNo: fee.no,
        date,
        createdAt: date,
        category: fee.category,
        amount: fee.amount,
        purchaseNo: fee.purchaseNo,
        notes: fee.purchaseNo ? `คู่กับ ${fee.purchaseNo}` : null,
      },
    });
  }

  console.log(
    `แดชบอร์ดตัวอย่าง: รับซื้อ ${purchaseCount}, ขาย ${salePlan.length}, ราคา ${priceCount}, ค่าใช้จ่าย ${expenses.length}, ค่าบริการ ${fees.length}`,
  );
  console.log(`ประเภทที่ยังไม่ตั้งราคาวันนี้: ${productTypes[productTypes.length - 1]?.name ?? '-'}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
