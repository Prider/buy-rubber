/**
 * Seed closed stock "gangs" (กอง) for load-testing /reports/profit-loss/gangs.
 *
 * The gangs API scans StockLedgerEntry for a product type and splits cycles whenever
 * balance goes 0 → >0 → 0. Matching Sale rows are needed for revenue.
 *
 * Run after main seed (needs User + ProductType):
 *   npx tsx prisma/seedGangs.ts
 *   npm run db:seed:gangs:for:test
 *
 * Defaults create ~100,000 ledger rows (50,000 closed gangs × 1 purchase + 1 sale).
 *
 * Optional env:
 *   GANGS=50000              number of closed gangs (default 50000)
 *   SALES_PER_GANG=1         sales that deplete each gang (default 1)
 *   PURCHASES_PER_GANG=1     purchases that open each gang (default 1)
 *   PRODUCT_TYPE_CODE=R1     target product type code (default: first by code)
 *   CLEAR=1                  clear prior GANG-* load-test data for that product (default 1)
 *
 * Examples:
 *   GANGS=10000 npm run db:seed:gangs:for:test
 *   GANGS=25000 SALES_PER_GANG=3 npm run db:seed:gangs:for:test
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EPS = 1e-6;
const BATCH_SIZE = 1_000;
const REF_PREFIX = 'GANG';

const GANG_COUNT = Math.max(1, parseInt(process.env.GANGS || '50000', 10) || 50_000);
const SALES_PER_GANG = Math.max(1, parseInt(process.env.SALES_PER_GANG || '1', 10) || 1);
const PURCHASES_PER_GANG = Math.max(
  1,
  parseInt(process.env.PURCHASES_PER_GANG || '1', 10) || 1,
);
const CLEAR = (process.env.CLEAR || '1') !== '0';
const PRODUCT_TYPE_CODE = process.env.PRODUCT_TYPE_CODE?.trim() || '';

const COMPANY_NAMES = [
  'บริษัท ยางไทย จำกัด',
  'ห้างหุ้นส่วนจำกัด รับซื้อยางใต้',
  'บริษัท แปรรูปยางภาคใต้ จำกัด',
  'บริษัท ส่งออกยางพารา จำกัด',
  'โรงงานแปรรูปยางสงขลา',
] as const;

type StockState = { qtyKg: number; avgCostPerKg: number };

type LedgerRow = {
  productTypeId: string;
  refType: string;
  refNo: string;
  qtyChangeKg: number;
  unitCostPerKg: number;
  totalCost: number;
  balanceQtyKg: number;
  balanceAvgCostPerKg: number;
  date: Date;
  createdAt: Date;
  notes: string | null;
};

type SaleRow = {
  saleNo: string;
  date: Date;
  createdAt: Date;
  userId: string;
  companyName: string;
  destinationCompanyId: string | null;
  productTypeId: string;
  weight: number;
  rubberPercent: number | null;
  pricePerUnit: number;
  expenseType: string | null;
  expenseCost: number | null;
  sellingType: string;
  totalAmount: number;
  unitCostPerKg: number;
  costOfGoods: number;
  notes: string | null;
};

function pad(n: number, width: number) {
  return String(n).padStart(width, '0');
}

async function main() {
  const entriesPerGang = PURCHASES_PER_GANG + SALES_PER_GANG;
  const expectedLedger = GANG_COUNT * entriesPerGang;

  console.log('📦 seedGangs: สร้างข้อมูลกอง (stock ledger + sales) สำหรับทดสอบโหลด...');
  console.log(
    `   - gangs=${GANG_COUNT}, purchases/gang=${PURCHASES_PER_GANG}, sales/gang=${SALES_PER_GANG}`,
  );
  console.log(`   - expected ledger entries ≈ ${expectedLedger.toLocaleString()}`);

  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!user) {
    console.error('❌ ไม่พบผู้ใช้ในระบบ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  const productType = PRODUCT_TYPE_CODE
    ? await prisma.productType.findFirst({ where: { code: PRODUCT_TYPE_CODE } })
    : await prisma.productType.findFirst({ orderBy: { code: 'asc' } });

  if (!productType) {
    console.error('❌ ไม่พบประเภทสินค้า — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  console.log(`   - productType: ${productType.code} (${productType.name}) id=${productType.id}`);

  let destinationCompanyId: string | null = null;
  const existingCompany = await prisma.destinationCompany.findFirst({
    orderBy: { code: 'asc' },
  });
  if (existingCompany) {
    destinationCompanyId = existingCompany.id;
  } else {
    const created = await prisma.destinationCompany.create({
      data: { code: 'C001', name: COMPANY_NAMES[0] },
    });
    destinationCompanyId = created.id;
  }

  if (CLEAR) {
    const deletedSales = await prisma.sale.deleteMany({
      where: { saleNo: { startsWith: `${REF_PREFIX}-SAL-` } },
    });
    console.log(`   - ลบ Sale โหลดเทสเดิม: ${deletedSales.count}`);

    // Wipe all ledger for this product so gang balance cycles stay consistent.
    const wipedLedger = await prisma.stockLedgerEntry.deleteMany({
      where: { productTypeId: productType.id },
    });
    console.log(`   - ลบ StockLedger ของ ${productType.code}: ${wipedLedger.count}`);

    await prisma.stockPosition.deleteMany({ where: { productTypeId: productType.id } });
    console.log(`   - รีเซ็ต StockPosition ของ ${productType.code}`);

    const wipedGangs = await prisma.stockGang.deleteMany({
      where: { productTypeId: productType.id },
    });
    console.log(`   - ลบ StockGang ของ ${productType.code}: ${wipedGangs.count}`);
  }

  const baseTime = Date.UTC(2020, 0, 1, 7, 0, 0);
  // Space gangs by 2 minutes so date+createdAt ordering stays stable.
  const gangStepMs = 2 * 60_000;
  const withinGangStepMs = 5_000;

  let state: StockState = { qtyKg: 0, avgCostPerKg: 0 };
  let createdSales = 0;
  let createdLedger = 0;
  let gangNo = 0;

  let saleBatch: SaleRow[] = [];
  let ledgerBatch: LedgerRow[] = [];

  async function flushSales() {
    if (saleBatch.length === 0) return;
    const result = await prisma.sale.createMany({ data: saleBatch });
    createdSales += result.count;
    saleBatch = [];
  }

  async function flushLedger() {
    if (ledgerBatch.length === 0) return;
    const result = await prisma.stockLedgerEntry.createMany({ data: ledgerBatch });
    createdLedger += result.count;
    ledgerBatch = [];
  }

  for (let g = 0; g < GANG_COUNT; g++) {
    gangNo = g + 1;
    const gangStart = new Date(baseTime + g * gangStepMs);
    let eventIndex = 0;

    // --- purchases open the gang (balance 0 → >0) ---
    for (let p = 0; p < PURCHASES_PER_GANG; p++) {
      const qtyKg = parseFloat((80 + ((g * 17 + p * 13) % 420) + (g % 100) / 100).toFixed(2));
      const unitCostPerKg = parseFloat((35 + ((g * 11 + p) % 1500) / 100).toFixed(2));
      const newQty = state.qtyKg + qtyKg;
      const newAvg =
        newQty <= EPS
          ? 0
          : (state.qtyKg * state.avgCostPerKg + qtyKg * unitCostPerKg) / newQty;

      state = { qtyKg: newQty, avgCostPerKg: newAvg };

      const at = new Date(gangStart.getTime() + eventIndex * withinGangStepMs);
      eventIndex += 1;

      ledgerBatch.push({
        productTypeId: productType.id,
        refType: 'PURCHASE',
        refNo: `${REF_PREFIX}-PUR-${pad(gangNo, 6)}-${pad(p + 1, 2)}`,
        qtyChangeKg: qtyKg,
        unitCostPerKg,
        totalCost: parseFloat((qtyKg * unitCostPerKg).toFixed(2)),
        balanceQtyKg: newQty,
        balanceAvgCostPerKg: newAvg,
        date: at,
        createdAt: at,
        notes: `load-test gang ${gangNo} purchase ${p + 1}`,
      });
    }

    // --- sales deplete the gang back to 0 ---
    let remaining = state.qtyKg;
    for (let s = 0; s < SALES_PER_GANG; s++) {
      const isLast = s === SALES_PER_GANG - 1;
      const rawQty = isLast
        ? remaining
        : parseFloat((remaining / (SALES_PER_GANG - s)).toFixed(2));
      const qtyKg = Math.max(0.01, parseFloat(rawQty.toFixed(2)));
      const sellQty = isLast ? remaining : Math.min(remaining, qtyKg);

      const unitCostPerKg = state.avgCostPerKg;
      const newQty = Math.max(0, state.qtyKg - sellQty);
      const newAvg = newQty <= EPS ? 0 : unitCostPerKg;
      const cogs = parseFloat((sellQty * unitCostPerKg).toFixed(2));

      state = { qtyKg: newQty <= EPS ? 0 : newQty, avgCostPerKg: newAvg };
      remaining = state.qtyKg;

      const at = new Date(gangStart.getTime() + eventIndex * withinGangStepMs);
      eventIndex += 1;

      const saleNo = `${REF_PREFIX}-SAL-${pad(gangNo, 6)}-${pad(s + 1, 2)}`;
      const pricePerUnit = parseFloat((unitCostPerKg + 2 + ((g + s) % 800) / 100).toFixed(2));
      const totalAmount = parseFloat((sellQty * pricePerUnit).toFixed(2));

      saleBatch.push({
        saleNo,
        date: at,
        createdAt: at,
        userId: user.id,
        companyName: COMPANY_NAMES[g % COMPANY_NAMES.length],
        destinationCompanyId,
        productTypeId: productType.id,
        weight: sellQty,
        rubberPercent: g % 5 === 0 ? null : parseFloat((55 + (g % 15) + (g % 80) / 10).toFixed(2)),
        pricePerUnit,
        expenseType: null,
        expenseCost: null,
        sellingType: g % 3 === 0 ? 'จ่ายสด' : g % 3 === 1 ? 'ขายล่วง' : 'ฝาก',
        totalAmount,
        unitCostPerKg,
        costOfGoods: cogs,
        notes: `load-test gang ${gangNo} sale ${s + 1}`,
      });

      ledgerBatch.push({
        productTypeId: productType.id,
        refType: 'SALE',
        refNo: saleNo,
        qtyChangeKg: -sellQty,
        unitCostPerKg,
        totalCost: cogs,
        balanceQtyKg: state.qtyKg,
        balanceAvgCostPerKg: state.avgCostPerKg,
        date: at,
        createdAt: at,
        notes: `load-test gang ${gangNo} sale ${s + 1}`,
      });
    }

    // Force exact zero in case of float noise
    if (state.qtyKg <= EPS) {
      state = { qtyKg: 0, avgCostPerKg: 0 };
      if (ledgerBatch.length > 0) {
        const last = ledgerBatch[ledgerBatch.length - 1]!;
        if (last.refType === 'SALE') {
          last.balanceQtyKg = 0;
          last.balanceAvgCostPerKg = 0;
        }
      }
    }

    if (saleBatch.length >= BATCH_SIZE) await flushSales();
    if (ledgerBatch.length >= BATCH_SIZE) await flushLedger();

    if (gangNo % 5_000 === 0) {
      console.log(
        `   ✓ gang ${gangNo.toLocaleString()} / ${GANG_COUNT.toLocaleString()}` +
          ` (ledger=${createdLedger.toLocaleString()}, sales=${createdSales.toLocaleString()})`,
      );
    }
  }

  await flushSales();
  await flushLedger();
  console.log(
    `   ✓ gang ${GANG_COUNT.toLocaleString()} / ${GANG_COUNT.toLocaleString()}` +
      ` (ledger=${createdLedger.toLocaleString()}, sales=${createdSales.toLocaleString()})`,
  );

  await prisma.stockPosition.create({
    data: {
      productTypeId: productType.id,
      quantityKg: state.qtyKg,
      avgCostPerKg: state.avgCostPerKg,
    },
  });

  const { rebuildStockGangs } = await import('../src/lib/stock/stockGangs');
  const gangsResult = await rebuildStockGangs(prisma, productType.id);
  console.log(`   - materialize StockGang: ${gangsResult.gangs.toLocaleString()} rows`);

  console.log('✅ seedGangs เสร็จ');
  console.log(`   - gangs: ${GANG_COUNT.toLocaleString()}`);
  console.log(`   - sales: ${createdSales.toLocaleString()}`);
  console.log(`   - ledger entries: ${createdLedger.toLocaleString()}`);
  console.log(`   - final stock balance: ${state.qtyKg} kg`);
  console.log('');
  console.log(
    `เปิด /reports/profit-loss/gangs?productTypeId=${productType.id} เพื่อทดสอบโหลด`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
