/**
 * Backfill Sale.unitCostPerKg / Sale.costOfGoods from StockLedgerEntry SALE rows.
 *
 *   npx tsx prisma/backfillSaleCogs.ts
 *   npm run db:backfill-sale-cogs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH = 500;

async function main() {
  console.log('🧾 backfillSaleCogs: จาก StockLedgerEntry → Sale...');

  const ledger = await prisma.stockLedgerEntry.findMany({
    where: { refType: 'SALE', refNo: { not: null } },
    select: { refNo: true, unitCostPerKg: true, totalCost: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Latest ledger row wins per saleNo
  const bySaleNo = new Map<string, { unitCostPerKg: number | null; totalCost: number | null }>();
  for (const e of ledger) {
    if (!e.refNo || bySaleNo.has(e.refNo)) continue;
    bySaleNo.set(e.refNo, { unitCostPerKg: e.unitCostPerKg, totalCost: e.totalCost });
  }

  console.log(`   - ledger SALE refs: ${bySaleNo.size.toLocaleString()}`);

  const saleNos = [...bySaleNo.keys()];
  let updated = 0;

  for (let i = 0; i < saleNos.length; i += BATCH) {
    const chunk = saleNos.slice(i, i + BATCH);
    const sales = await prisma.sale.findMany({
      where: { saleNo: { in: chunk } },
      select: { id: true, saleNo: true, weight: true },
    });

    await prisma.$transaction(
      sales.map((sale) => {
        const cost = bySaleNo.get(sale.saleNo);
        const unitCostPerKg =
          cost?.unitCostPerKg != null && Number.isFinite(Number(cost.unitCostPerKg))
            ? Number(cost.unitCostPerKg)
            : null;
        let costOfGoods =
          cost?.totalCost != null && Number.isFinite(Number(cost.totalCost))
            ? Number(cost.totalCost)
            : null;
        if (costOfGoods == null && unitCostPerKg != null) {
          costOfGoods = sale.weight * unitCostPerKg;
        }
        return prisma.sale.update({
          where: { id: sale.id },
          data: { unitCostPerKg, costOfGoods },
        });
      }),
    );

    updated += sales.length;
    if (updated % 2000 === 0 || i + BATCH >= saleNos.length) {
      console.log(`   ✓ updated ${updated.toLocaleString()} / ${saleNos.length.toLocaleString()}`);
    }
  }

  console.log(`✅ backfillSaleCogs เสร็จ: ${updated.toLocaleString()} รายการ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
