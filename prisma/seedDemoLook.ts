/**
 * Sample shop data for looking at the app: members, companies, prices,
 * purchases, sales, expenses, service fees, then a stock rebuild.
 *
 * Keeps existing rows (the test member, company, and expense stay).
 * Re-running replaces only documents numbered like PUR-20261111-9001.
 *
 *   npm run db:seed:demo
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

const prisma = new PrismaClient();

const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAYS = 21;
const DEMO_NO = /^(PUR|SAL|EXP|SVC)-\d{8}-9\d{3}$/;

const MEMBERS = [
  { code: 'M201', name: 'สมชาย ทองดี', phone: '0812341101', idCard: '190980012345', bankName: 'ธนาคารกสิกรไทย', bankAccount: '1234567890', address: '45 หมู่ 3 ต.คลองแห อ.หาดใหญ่ จ.สงขลา', ownerPercent: 70, tapperPercent: 30, tapperName: 'วิชัย คนตัด', advanceBalance: 0, isActive: true },
  { code: 'M202', name: 'มาลี แก้วมณี', phone: '0823452202', idCard: '190980023456', bankName: 'ธนาคารกรุงไทย', bankAccount: '2345678901', address: '88 หมู่ 7 ต.สำนักขาม อ.สะเดา จ.สงขลา', ownerPercent: 100, tapperPercent: 0, tapperName: '', advanceBalance: 1500, isActive: true },
  { code: 'M203', name: 'ประยุทธ์ ศรีสุข', phone: '0834563303', idCard: '190980034567', bankName: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)', bankAccount: '3456789012', address: '12 หมู่ 2 ต.ควนรู อ.รัตภูมิ จ.สงขลา', ownerPercent: 60, tapperPercent: 40, tapperName: 'สมพงษ์ คนตัด', advanceBalance: 0, isActive: true },
  { code: 'M204', name: 'สุดา พรหมมา', phone: '0845674404', idCard: '190980045678', bankName: 'ธนาคารออมสิน', bankAccount: '4567890123', address: '9 หมู่ 5 ต.นาทับ อ.จะนะ จ.สงขลา', ownerPercent: 80, tapperPercent: 20, tapperName: 'แสงเดือน คนตัด', advanceBalance: 800, isActive: true },
  { code: 'M205', name: 'เจริญ ยางไทย', phone: '0856785505', idCard: '190980056789', bankName: 'ธนาคารไทยพาณิชย์', bankAccount: '5678901234', address: '31 หมู่ 1 ต.นาทวี อ.นาทวี จ.สงขลา', ownerPercent: 100, tapperPercent: 0, tapperName: '', advanceBalance: 0, isActive: true },
  { code: 'M206', name: 'อรุณ คลองแห', phone: '0867896606', idCard: '190980067890', bankName: 'ธนาคารกรุงศรีอยุธยา', bankAccount: '6789012345', address: '102 หมู่ 4 ต.คลองแห อ.หาดใหญ่ จ.สงขลา', ownerPercent: 65, tapperPercent: 35, tapperName: 'สมศักดิ์ คนตัด', advanceBalance: 0, isActive: true },
  { code: 'M207', name: 'นภา สวนยาง', phone: '0878907707', idCard: '190980078901', bankName: 'ธนาคารกรุงเทพ', bankAccount: '7890123456', address: '17 หมู่ 6 ต.คลองหอยโข่ง อ.คลองหอยโข่ง จ.สงขลา', ownerPercent: 75, tapperPercent: 25, tapperName: 'บุญมี คนตัด', advanceBalance: 2500, isActive: true },
  { code: 'M208', name: 'วิเชียร บุญมา', phone: '0889018808', idCard: '190980089012', bankName: 'ธนาคารทหารไทยธนชาต', bankAccount: '8901234567', address: '6 หมู่ 8 ต.ระโนด อ.ระโนด จ.สงขลา', ownerPercent: 100, tapperPercent: 0, tapperName: '', advanceBalance: 0, isActive: true },
  { code: 'M209', name: 'คำพัน ใจงาม', phone: '0890129909', idCard: '190980090123', bankName: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)', bankAccount: '9012345678', address: '54 หมู่ 2 ต.จะทิ้งพระ อ.สทิงพระ จ.สงขลา', ownerPercent: 90, tapperPercent: 10, tapperName: 'สมพร คนตัด', advanceBalance: 0, isActive: true },
  { code: 'M210', name: 'วันเพ็ญ ศรีวงศ์', phone: '0811230010', idCard: '190980101234', bankName: 'ธนาคารกสิกรไทย', bankAccount: '1122334455', address: '23 หมู่ 9 ต.เทพา อ.เทพา จ.สงขลา', ownerPercent: 70, tapperPercent: 30, tapperName: 'อนันต์ คนตัด', advanceBalance: 0, isActive: true },
  { code: 'M211', name: 'สมบูรณ์ นาคา', phone: '0822341111', idCard: '190980112345', bankName: 'ธนาคารออมสิน', bankAccount: '2233445566', address: '77 หมู่ 1 ต.ปากรอ อ.สิงหนคร จ.สงขลา', ownerPercent: 100, tapperPercent: 0, tapperName: '', advanceBalance: 5000, isActive: true },
  { code: 'M212', name: 'กมลชนก รัตนะ', phone: '0833452212', idCard: '190980123456', bankName: 'ธนาคารกรุงไทย', bankAccount: '3344556677', address: '14 หมู่ 3 ต.ควนเนียง อ.ควนเนียง จ.สงขลา', ownerPercent: 55, tapperPercent: 45, tapperName: 'ประเสริฐ คนตัด', advanceBalance: 0, isActive: true },
  { code: 'M213', name: 'บุญช่วย แสงทอง', phone: '0844563313', idCard: '190980134567', bankName: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)', bankAccount: '4455667788', address: '28 หมู่ 4 ต.บ้านพรุ อ.หาดใหญ่ จ.สงขลา', ownerPercent: 100, tapperPercent: 0, tapperName: '', advanceBalance: 0, isActive: true },
  { code: 'M214', name: 'ศิริพร ดวงดี', phone: '0855674414', idCard: '190980145678', bankName: 'ธนาคารไทยพาณิชย์', bankAccount: '5566778899', address: '3 หมู่ 5 ต.คอหงส์ อ.หาดใหญ่ จ.สงขลา', ownerPercent: 100, tapperPercent: 0, tapperName: '', advanceBalance: 0, isActive: false },
] as const;

const COMPANIES = [
  { code: 'C201', name: 'บริษัท ยางไทย จำกัด', phone: '074311001', address: '99 ถ.เพชรเกษม ต.หาดใหญ่ อ.หาดใหญ่ จ.สงขลา' },
  { code: 'C202', name: 'ห้างหุ้นส่วนจำกัด รับซื้อยางใต้', phone: '074322002', address: '15 ถ.นครนอก ต.บ่อยาง อ.เมืองสงขลา จ.สงขลา' },
  { code: 'C203', name: 'บริษัท แปรรูปยางภาคใต้ จำกัด', phone: '077333003', address: '210 หมู่ 2 ต.ขุนทะเล อ.เมืองสุราษฎร์ธานี จ.สุราษฎร์ธานี' },
  { code: 'C204', name: 'โรงงานแปรรูปยางสงขลา', phone: '074344004', address: 'นิคมอุตสาหกรรมสงขลา ต.ฉลุง อ.หาดใหญ่ จ.สงขลา' },
  { code: 'C205', name: 'บริษัท ลาเท็กซ์โปร จำกัด', phone: '074355005', address: '48 ถ.ลพบุรีราเมศวร์ ต.หาดใหญ่ อ.หาดใหญ่ จ.สงขลา' },
  { code: 'C206', name: 'หจก. ค้ายางคลองแห', phone: '0819002206', address: 'หมู่ 4 ต.คลองแห อ.หาดใหญ่ จ.สงขลา' },
  { code: 'C207', name: 'บริษัท ส่งออกยางพารา จำกัด', phone: '074366007', address: 'ท่าเรือสงขลา ต.บ่อยาง อ.เมืองสงขลา จ.สงขลา' },
  { code: 'C208', name: 'ศูนย์รวมยางหาดใหญ่', phone: '074377008', address: '12 ถ.ศุภสารรังสรรค์ ต.หาดใหญ่ อ.หาดใหญ่ จ.สงขลา' },
  { code: 'C209', name: 'บริษัท เอเชียน รับเบอร์ จำกัด', phone: '075388009', address: '88 ถ.ห้วยยอด ต.ทับเที่ยง อ.เมืองตรัง จ.ตรัง' },
  { code: 'C210', name: 'ห้างหุ้นส่วนจำกัด ยางคุณภาพ', phone: '075399010', address: '56 ถ.พัฒนาการคูขวาง ต.ในเมือง อ.เมืองนครศรีธรรมราช จ.นครศรีธรรมราช' },
] as const;

const SERVICE_FEE_CATEGORIES = ['ค่าชั่ง', 'ค่าขนส่งหน้าจุด', 'ค่าถุง', 'ค่าบริการอื่นๆ'];

const PRODUCT_BASE_PRICE: Record<string, number> = {
  RUBER1: 52,
  RUBER2: 45,
  RUBER3: 40,
  RUBER4: 58,
  RUBER5: 63,
  NUTS: 22,
};

const WEIGHT_RANGE: Record<string, [number, number]> = {
  RUBER1: [90, 320],
  RUBER2: [50, 220],
  RUBER3: [35, 150],
  RUBER4: [45, 180],
  RUBER5: [40, 140],
  NUTS: [18, 70],
};

const SELLING_TYPES = ['จ่ายสด', 'จ่ายสด', 'จ่ายสด', 'ขายล่วง', 'ฝาก'] as const;

const EXPENSE_PLAN: Array<{ daysAgo: number; category: string; amount: number; description: string; hour: number }> = [
  { daysAgo: 0, category: 'ค่าน้ำมัน', amount: 1850, description: 'น้ำมันรถรับซื้อรอบหาดใหญ่', hour: 7 },
  { daysAgo: 0, category: 'ค่าคนงาน', amount: 2400, description: 'ค่าแรงยกยางวันนี้', hour: 16 },
  { daysAgo: 1, category: 'ค่าน้ำมัน', amount: 1420, description: 'น้ำมันรถกระบะ', hour: 8 },
  { daysAgo: 2, category: 'ค่าซ่อมรถ', amount: 3200, description: 'เปลี่ยนยางรถกระบะ', hour: 11 },
  { daysAgo: 3, category: 'ค่าคนงาน', amount: 1800, description: 'ค่าแรงคัดยาง', hour: 15 },
  { daysAgo: 4, category: 'ค่าน้ำมัน', amount: 1680, description: 'น้ำมันรอบสะเดา', hour: 7 },
  { daysAgo: 5, category: 'อื่นๆ', amount: 450, description: 'ค่าน้ำแข็งและน้ำดื่มหน้าลาน', hour: 9 },
  { daysAgo: 6, category: 'ค่าคนงาน', amount: 2600, description: 'ค่าแรงยกยางเข้าโกดัง', hour: 16 },
  { daysAgo: 8, category: 'ค่าน้ำมัน', amount: 2100, description: 'น้ำมันรถหกล้อส่งยาง', hour: 6 },
  { daysAgo: 9, category: 'ค่าซ่อมรถ', amount: 890, description: 'ซ่อมเครื่องชั่ง', hour: 13 },
  { daysAgo: 11, category: 'ค่าคนงาน', amount: 2000, description: 'ค่าแรงวันรับซื้อหนา', hour: 17 },
  { daysAgo: 12, category: 'ค่าน้ำมัน', amount: 1560, description: 'น้ำมันรถรับซื้อ', hour: 7 },
  { daysAgo: 14, category: 'อื่นๆ', amount: 650, description: 'ค่าถุงและเชือกมัดยาง', hour: 10 },
  { daysAgo: 16, category: 'ค่าน้ำมัน', amount: 1740, description: 'น้ำมันรอบจะนะ', hour: 8 },
  { daysAgo: 18, category: 'ค่าคนงาน', amount: 2200, description: 'ค่าแรงยกยาง', hour: 16 },
];

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261111);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function between(min: number, max: number): number {
  return min + rand() * (max - min);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function thaiNationalId(body12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(body12[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return `${body12}${check}`;
}

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

function ymd(dayStart: Date): string {
  const shifted = new Date(dayStart.getTime() + THAILAND_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function weekday(dayStart: Date): number {
  return new Date(dayStart.getTime() + THAILAND_OFFSET_MS).getUTCDay();
}

function docNo(prefix: string, dayStart: Date, seq: number): string {
  return `${prefix}-${ymd(dayStart)}-${seq}`;
}

function isDemoNo(value: string): boolean {
  return DEMO_NO.test(value);
}

async function deleteDemoDocuments() {
  const [purchases, sales, expenses, fees] = await Promise.all([
    prisma.purchase.findMany({ select: { id: true, purchaseNo: true } }),
    prisma.sale.findMany({ select: { id: true, saleNo: true } }),
    prisma.expense.findMany({ select: { id: true, expenseNo: true } }),
    prisma.serviceFee.findMany({ select: { id: true, serviceFeeNo: true, purchaseNo: true } }),
  ]);

  const purchaseIds = purchases.filter((row) => isDemoNo(row.purchaseNo)).map((row) => row.id);
  const purchaseNos = new Set(purchases.filter((row) => isDemoNo(row.purchaseNo)).map((row) => row.purchaseNo));
  const saleIds = sales.filter((row) => isDemoNo(row.saleNo)).map((row) => row.id);
  const expenseIds = expenses.filter((row) => isDemoNo(row.expenseNo)).map((row) => row.id);
  const feeIds = fees
    .filter((row) => isDemoNo(row.serviceFeeNo) || (row.purchaseNo != null && purchaseNos.has(row.purchaseNo)))
    .map((row) => row.id);

  if (feeIds.length) await prisma.serviceFee.deleteMany({ where: { id: { in: feeIds } } });
  if (purchaseIds.length) await prisma.purchase.deleteMany({ where: { id: { in: purchaseIds } } });
  if (saleIds.length) await prisma.sale.deleteMany({ where: { id: { in: saleIds } } });
  if (expenseIds.length) await prisma.expense.deleteMany({ where: { id: { in: expenseIds } } });

  console.log(
    `   - ลบข้อมูลตัวอย่างเดิม: รับซื้อ ${purchaseIds.length}, ขาย ${saleIds.length}, ค่าใช้จ่าย ${expenseIds.length}, ค่าบริการ ${feeIds.length}`,
  );
}

async function main() {
  console.log('🌱 seedDemoLook: เติมข้อมูลให้ดูหน้าจอในแอป...');

  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['admin', 'user', 'root'] } },
    orderBy: { username: 'asc' },
  });
  const productTypes = await prisma.productType.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  if (users.length === 0) {
    console.error('ไม่พบผู้ใช้ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }
  if (productTypes.length === 0) {
    console.error('ไม่พบประเภทสินค้า — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  await deleteDemoDocuments();

  const members = [];
  for (const sample of MEMBERS) {
    const idCard = thaiNationalId(sample.idCard);
    const data = {
      name: sample.name,
      phone: sample.phone,
      idCard,
      address: sample.address,
      bankName: sample.bankName,
      bankAccount: sample.bankAccount,
      ownerPercent: sample.ownerPercent,
      tapperPercent: sample.tapperPercent,
      tapperName: sample.tapperName,
      advanceBalance: sample.advanceBalance,
      isActive: sample.isActive,
    };
    const member = await prisma.member.upsert({
      where: { code: sample.code },
      update: data,
      create: { code: sample.code, ...data },
    });
    members.push(member);
  }

  const companies = [];
  for (const sample of COMPANIES) {
    const company = await prisma.destinationCompany.upsert({
      where: { code: sample.code },
      update: { name: sample.name, phone: sample.phone, address: sample.address, isActive: true },
      create: { ...sample, isActive: true },
    });
    companies.push(company);
  }

  for (let index = 0; index < SERVICE_FEE_CATEGORIES.length; index += 1) {
    const name = SERVICE_FEE_CATEGORIES[index];
    await prisma.serviceFeeCategory.upsert({
      where: { name },
      update: { isActive: true, sortOrder: index },
      create: { name, sortOrder: index, isActive: true },
    });
  }

  const activeMembers = members.filter((member) => member.isActive);
  const pricedTypes = productTypes.filter((product) => PRODUCT_BASE_PRICE[product.code] != null);
  const priceByType = new Map<string, Map<number, number>>();

  for (const product of pricedTypes) {
    const base = PRODUCT_BASE_PRICE[product.code];
    const byDay = new Map<number, number>();
    for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
      const wave = Math.sin((DAYS - daysAgo) / 3) * (product.code === 'NUTS' ? 0.8 : 1.6);
      const price = round2(base + wave + (rand() - 0.45) * 0.8);
      byDay.set(daysAgo, price);
      const date = atHour(thailandDayStart(daysAgo), 7, 5);
      await prisma.productPrice.upsert({
        where: { date_productTypeId: { date, productTypeId: product.id } },
        update: { price },
        create: { date, productTypeId: product.id, price },
      });
    }
    priceByType.set(product.id, byDay);
  }

  type PurchaseRow = {
    purchaseNo: string;
    date: Date;
    createdAt: Date;
    memberId: string;
    productTypeId: string;
    userId: string;
    grossWeight: number;
    containerWeight: number;
    netWeight: number;
    rubberPercent: number | null;
    dryWeight: number;
    moisturePercent: number;
    moistureUnit: string;
    basePrice: number;
    adjustedPrice: number;
    bonusPrice: number;
    finalPrice: number;
    totalAmount: number;
    ownerAmount: number;
    tapperAmount: number;
    isPaid: boolean;
    notes: string | null;
  };

  type SaleDraft = {
    saleNo: string;
    date: Date;
    createdAt: Date;
    userId: string;
    companyName: string;
    destinationCompanyId: string;
    productTypeId: string;
    weight: number;
    rubberPercent: number | null;
    pricePerUnit: number;
    sellingType: string;
    expenseLines: Array<{ type: string; amount: number; note: string | null }>;
    unitCostPerKg?: number;
    costOfGoods?: number;
  };

  const purchaseRows: PurchaseRow[] = [];
  const saleDrafts: SaleDraft[] = [];
  const feeRows: Array<{
    serviceFeeNo: string;
    purchaseNo: string;
    date: Date;
    createdAt: Date;
    category: string;
    amount: number;
    notes: string | null;
  }> = [];

  const qty = new Map<string, number>();
  let purchaseSeq = 9001;
  let saleSeq = 9001;
  let feeSeq = 9001;

  for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const dayStart = thailandDayStart(daysAgo);
    const dow = weekday(dayStart);
    const ticketCount = daysAgo === 0 ? 6 : dow === 0 ? 2 : 3 + Math.floor(rand() * 3);
    let minute = 10;

    for (let ticket = 0; ticket < ticketCount; ticket += 1) {
      const member = activeMembers[(purchaseSeq + ticket) % activeMembers.length];
      const lineCount = rand() < 0.22 ? 2 : 1;
      const used = new Set<string>();
      const purchaseNo = docNo('PUR', dayStart, purchaseSeq);
      purchaseSeq += 1;
      const recordUser = users[purchaseSeq % users.length];
      const date = atHour(dayStart, 8 + Math.floor(minute / 60), minute % 60);
      minute += 18 + Math.floor(rand() * 12);

      for (let line = 0; line < lineCount; line += 1) {
        let product = pick(pricedTypes);
        let guard = 0;
        while (used.has(product.id) && guard < 6) {
          product = pick(pricedTypes);
          guard += 1;
        }
        used.add(product.id);

        const [minWeight, maxWeight] = WEIGHT_RANGE[product.code] ?? [40, 120];
        const dayBoost = daysAgo === 0 ? 1.15 : 0.85 + Math.sin(daysAgo) * 0.12;
        const grossWeight = round2(between(minWeight, maxWeight) * dayBoost);
        const containerWeight = round2(Math.min(12, 3 + rand() * 6));
        const weighedNet = round2(grossWeight - containerWeight);
        const listPrice = priceByType.get(product.id)?.get(daysAgo) ?? PRODUCT_BASE_PRICE[product.code] ?? 40;

        let rubberPercent: number | null = null;
        if (product.code === 'RUBER1') rubberPercent = round2(between(28, 36));
        else if (rand() < 0.35) rubberPercent = round2(between(58, 72));

        let adjustedPrice = listPrice;
        if (rubberPercent != null && product.code === 'RUBER1') {
          adjustedPrice = round2(listPrice + (rubberPercent - 32) * 0.35);
        }
        const bonusPrice = rand() < 0.2 ? round2(pick([0.5, 1, 1.5])) : 0;
        const finalPrice = round2(adjustedPrice + bonusPrice);

        let moisturePercent = 0;
        let moistureUnit = 'baht';
        let netWeight = weighedNet;
        let totalAmount = round2(weighedNet * finalPrice);
        const dryish = product.code === 'RUBER2' || product.code === 'RUBER4' || product.code === 'RUBER5';
        if (dryish && rand() < 0.45 && weighedNet > 20) {
          moistureUnit = 'kg';
          moisturePercent = round2(between(1, Math.min(6, weighedNet * 0.04)));
          netWeight = round2(weighedNet - moisturePercent);
          totalAmount = round2(netWeight * finalPrice);
        } else if (rand() < 0.25) {
          moisturePercent = round2(between(20, 80));
          totalAmount = round2(Math.max(0, weighedNet * finalPrice - moisturePercent));
        }

        const dryWeight = rubberPercent != null ? round2(netWeight * (rubberPercent / 100)) : netWeight;
        const ownerAmount = round2((totalAmount * member.ownerPercent) / 100);
        const tapperAmount = round2((totalAmount * member.tapperPercent) / 100);
        const notes = moisturePercent > 0 && rand() < 0.5 ? 'หักความชื้นตามตาชั่ง' : null;

        purchaseRows.push({
          purchaseNo,
          date,
          createdAt: date,
          memberId: member.id,
          productTypeId: product.id,
          userId: recordUser.id,
          grossWeight,
          containerWeight,
          netWeight,
          rubberPercent,
          dryWeight,
          moisturePercent,
          moistureUnit,
          basePrice: listPrice,
          adjustedPrice,
          bonusPrice,
          finalPrice,
          totalAmount,
          ownerAmount,
          tapperAmount,
          isPaid: daysAgo > 1 || rand() > 0.35,
          notes,
        });
        qty.set(product.id, (qty.get(product.id) ?? 0) + netWeight);
      }

      if (rand() < 0.55) {
        const feeDate = new Date(date.getTime() + 2 * 60 * 1000);
        feeRows.push({
          serviceFeeNo: docNo('SVC', dayStart, feeSeq),
          purchaseNo,
          date: feeDate,
          createdAt: feeDate,
          category: 'ค่าชั่ง',
          amount: round2(pick([20, 30, 40, 50])),
          notes: `คู่กับ ${purchaseNo}`,
        });
        feeSeq += 1;
        if (rand() < 0.3) {
          feeRows.push({
            serviceFeeNo: docNo('SVC', dayStart, feeSeq),
            purchaseNo,
            date: feeDate,
            createdAt: feeDate,
            category: pick(['ค่าถุง', 'ค่าขนส่งหน้าจุด']),
            amount: round2(between(30, 120)),
            notes: null,
          });
          feeSeq += 1;
        }
      }
    }

    const saleCount = daysAgo === 0 ? 2 : daysAgo % 2 === 0 ? 1 : rand() < 0.35 ? 1 : 0;
    for (let saleIndex = 0; saleIndex < saleCount; saleIndex += 1) {
      const candidates = pricedTypes
        .map((product) => ({ product, available: qty.get(product.id) ?? 0 }))
        .filter((item) => item.available >= (item.product.code === 'NUTS' ? 40 : 140))
        .sort((a, b) => b.available - a.available);
      const chosen = candidates[saleIndex];
      if (!chosen) continue;

      const leave = chosen.product.code === 'NUTS' ? 15 : 80;
      const sellWeight = round2(Math.min(chosen.available - leave, between(chosen.available * 0.28, chosen.available * 0.48)));
      if (sellWeight < 20) continue;
      qty.set(chosen.product.id, round2(chosen.available - sellWeight));

      const listPrice = priceByType.get(chosen.product.id)?.get(daysAgo) ?? 50;
      const thin = saleDrafts.length % 11 === 7;
      const pricePerUnit = round2(listPrice + (thin ? 1.5 : between(6, 14)));
      const expenseLines: SaleDraft['expenseLines'] = [];
      if (rand() < 0.6) {
        expenseLines.push({
          type: 'ค่าขนส่ง',
          amount: round2(thin ? between(1800, 3200) : between(250, 900)),
          note: pick(['รถหกล้อ', 'รถกระบะสองคัน', 'ส่งถึงโรงงาน']),
        });
      }
      if (rand() < 0.35) {
        expenseLines.push({
          type: 'ค่าแรง',
          amount: round2(between(150, 500)),
          note: 'ค่ายกขึ้นรถ',
        });
      }

      const company = companies[(saleSeq + saleIndex) % companies.length];
      const date = atHour(dayStart, 15 + saleIndex, 10 + saleIndex * 15);
      saleDrafts.push({
        saleNo: docNo('SAL', dayStart, saleSeq),
        date,
        createdAt: date,
        userId: users[saleSeq % users.length].id,
        companyName: company.name,
        destinationCompanyId: company.id,
        productTypeId: chosen.product.id,
        weight: sellWeight,
        rubberPercent: chosen.product.code === 'RUBER1' ? round2(between(30, 35)) : null,
        pricePerUnit,
        sellingType: pick(SELLING_TYPES),
        expenseLines,
      });
      saleSeq += 1;
    }
  }

  const stock = new Map<string, { qty: number; avg: number }>();
  const events: Array<{ kind: 'purchase'; row: PurchaseRow } | { kind: 'sale'; row: SaleDraft }> = [
    ...purchaseRows.map((row) => ({ kind: 'purchase' as const, row })),
    ...saleDrafts.map((row) => ({ kind: 'sale' as const, row })),
  ];
  events.sort((a, b) => {
    const delta = a.row.date.getTime() - b.row.date.getTime();
    if (delta !== 0) return delta;
    if (a.kind === b.kind) return 0;
    return a.kind === 'purchase' ? -1 : 1;
  });

  for (const event of events) {
    const current = stock.get(event.row.productTypeId) ?? { qty: 0, avg: 0 };
    if (event.kind === 'purchase') {
      const unit = event.row.moisturePercent > 0 && event.row.netWeight > 0
        ? event.row.totalAmount / event.row.netWeight
        : event.row.finalPrice;
      const nextQty = current.qty + event.row.netWeight;
      const nextAvg = nextQty <= 1e-6 ? 0 : (current.qty * current.avg + event.row.netWeight * unit) / nextQty;
      stock.set(event.row.productTypeId, { qty: nextQty, avg: nextAvg });
    } else {
      event.row.unitCostPerKg = round2(current.avg);
      event.row.costOfGoods = round2(event.row.weight * current.avg);
      const nextQty = current.qty - event.row.weight;
      stock.set(event.row.productTypeId, { qty: nextQty, avg: nextQty <= 1e-6 ? 0 : current.avg });
    }
  }

  await prisma.purchase.createMany({ data: purchaseRows });

  for (const sale of saleDrafts) {
    const expenseCost = round2(sale.expenseLines.reduce((sum, line) => sum + line.amount, 0));
    const firstType = sale.expenseLines[0]?.type ?? null;
    const expenseType = sale.expenseLines.length > 1 && firstType
      ? `${firstType} (+${sale.expenseLines.length - 1})`
      : firstType;
    const notes = sale.expenseLines.map((line) => line.note).filter(Boolean).join('; ') || null;
    const totalAmount = round2(sale.weight * sale.pricePerUnit - expenseCost);

    await prisma.sale.create({
      data: {
        saleNo: sale.saleNo,
        date: sale.date,
        createdAt: sale.createdAt,
        userId: sale.userId,
        companyName: sale.companyName,
        destinationCompanyId: sale.destinationCompanyId,
        productTypeId: sale.productTypeId,
        weight: sale.weight,
        rubberPercent: sale.rubberPercent,
        pricePerUnit: sale.pricePerUnit,
        expenseType,
        expenseCost: expenseCost > 0 ? expenseCost : null,
        sellingType: sale.sellingType,
        totalAmount,
        unitCostPerKg: sale.unitCostPerKg ?? null,
        costOfGoods: sale.costOfGoods ?? null,
        notes,
        expenses: {
          create: sale.expenseLines.map((line, index) => ({
            type: line.type,
            amount: line.amount,
            note: line.note,
            sortOrder: index,
          })),
        },
      },
    });
  }

  if (feeRows.length) {
    await prisma.serviceFee.createMany({ data: feeRows });
  }

  const expenseUser = users[0];
  await prisma.expense.createMany({
    data: EXPENSE_PLAN.map((expense, index) => {
      const date = atHour(thailandDayStart(expense.daysAgo), expense.hour, 12);
      return {
        expenseNo: docNo('EXP', thailandDayStart(expense.daysAgo), 9001 + index),
        date,
        createdAt: date,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        userId: expenseUser.id,
        userName: expenseUser.username,
      };
    }),
  });

  console.log(
    `✅ สมาชิก ${members.length}, บริษัท ${companies.length}, รับซื้อ ${purchaseRows.length} แถว, ขาย ${saleDrafts.length}, ค่าใช้จ่าย ${EXPENSE_PLAN.length}, ค่าบริการ ${feeRows.length}`,
  );
  console.log('🔁 คำนวณสต็อกใหม่จากรายการรับซื้อและขาย...');
  execSync('npx tsx prisma/rebuildStock.ts', { stdio: 'inherit' });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
