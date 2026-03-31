import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EPS = 1e-6;

type StockState = { qtyKg: number; avgCostPerKg: number };

async function main() {
  console.log('🔁 rebuildStock: start');

  await prisma.stockLedgerEntry.deleteMany({});
  await prisma.stockPosition.deleteMany({});

  const purchases = await prisma.purchase.findMany({
    select: {
      purchaseNo: true,
      productTypeId: true,
      netWeight: true,
      finalPrice: true,
      date: true,
      createdAt: true,
      notes: true,
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const sales = await prisma.sale.findMany({
    select: {
      saleNo: true,
      productTypeId: true,
      weight: true,
      date: true,
      createdAt: true,
      notes: true,
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const events: Array<
    | {
        type: 'PURCHASE';
        productTypeId: string;
        qtyKg: number;
        unitCostPerKg: number;
        refNo: string;
        date: Date;
        notes: string | null;
      }
    | {
        type: 'SALE';
        productTypeId: string;
        qtyToDeductKg: number;
        refNo: string;
        date: Date;
        notes: string | null;
      }
  > = [];

  for (const p of purchases) {
    events.push({
      type: 'PURCHASE',
      productTypeId: p.productTypeId,
      qtyKg: p.netWeight,
      unitCostPerKg: p.finalPrice,
      refNo: p.purchaseNo,
      date: p.date,
      notes: p.notes,
    });
  }

  for (const s of sales) {
    events.push({
      type: 'SALE',
      productTypeId: s.productTypeId,
      qtyToDeductKg: s.weight,
      refNo: s.saleNo,
      date: s.date,
      notes: s.notes,
    });
  }

  // Sort by date then by type to make deterministic
  events.sort((a, b) => {
    const da = a.date.getTime();
    const db = b.date.getTime();
    if (da !== db) return da - db;
    // PURCHASE before SALE at the same timestamp
    return a.type === b.type ? 0 : a.type === 'PURCHASE' ? -1 : 1;
  });

  const stockByProduct = new Map<string, StockState>();
  const ledgerEntries: Array<{
    productTypeId: string;
    refType: string;
    refNo: string | null;
    qtyChangeKg: number;
    unitCostPerKg: number | null;
    totalCost: number | null;
    balanceQtyKg: number;
    balanceAvgCostPerKg: number;
    date: Date;
    notes?: string | null;
  }> = [];

  for (const ev of events) {
    const current = stockByProduct.get(ev.productTypeId) || { qtyKg: 0, avgCostPerKg: 0 };

    if (ev.type === 'PURCHASE') {
      const newQty = current.qtyKg + ev.qtyKg;
      const newAvg =
        newQty <= EPS ? 0 : (current.qtyKg * current.avgCostPerKg + ev.qtyKg * ev.unitCostPerKg) / newQty;

      stockByProduct.set(ev.productTypeId, { qtyKg: newQty, avgCostPerKg: newAvg });

      ledgerEntries.push({
        productTypeId: ev.productTypeId,
        refType: 'PURCHASE',
        refNo: ev.refNo,
        qtyChangeKg: ev.qtyKg,
        unitCostPerKg: ev.unitCostPerKg,
        totalCost: ev.qtyKg * ev.unitCostPerKg,
        balanceQtyKg: newQty,
        balanceAvgCostPerKg: newAvg,
        date: ev.date,
        notes: ev.notes,
      });
    } else {
      const qtyToDeduct = ev.qtyToDeductKg;
      const unitCostPerKg = current.avgCostPerKg;
      const newQty = current.qtyKg - qtyToDeduct;
      const newAvg = newQty <= EPS ? 0 : unitCostPerKg;

      stockByProduct.set(ev.productTypeId, { qtyKg: newQty, avgCostPerKg: newAvg });

      ledgerEntries.push({
        productTypeId: ev.productTypeId,
        refType: 'SALE',
        refNo: ev.refNo,
        qtyChangeKg: -qtyToDeduct,
        unitCostPerKg,
        totalCost: qtyToDeduct * unitCostPerKg,
        balanceQtyKg: newQty,
        balanceAvgCostPerKg: newAvg,
        date: ev.date,
        notes: ev.notes,
      });
    }
  }

  const positionsData = Array.from(stockByProduct.entries()).map(([productTypeId, st]) => ({
    productTypeId,
    quantityKg: st.qtyKg,
    avgCostPerKg: st.avgCostPerKg,
  }));

  if (positionsData.length) {
    await prisma.stockPosition.createMany({
      data: positionsData,
    });
  }

  const chunkSize = 500;
  for (let i = 0; i < ledgerEntries.length; i += chunkSize) {
    const chunk = ledgerEntries.slice(i, i + chunkSize);
    await prisma.stockLedgerEntry.createMany({
      data: chunk.map((e) => ({
        productTypeId: e.productTypeId,
        refType: e.refType,
        refNo: e.refNo ?? null,
        qtyChangeKg: e.qtyChangeKg,
        unitCostPerKg: e.unitCostPerKg ?? null,
        totalCost: e.totalCost ?? null,
        balanceQtyKg: e.balanceQtyKg,
        balanceAvgCostPerKg: e.balanceAvgCostPerKg,
        date: e.date,
        notes: e.notes ?? undefined,
      })),
    });
  }

  console.log(
    '✅ rebuildStock: done',
    `positions=${positionsData.length}`,
    `ledgerEntries=${ledgerEntries.length}`,
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

