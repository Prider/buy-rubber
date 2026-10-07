/**
 * Rebuild stock positions and ledger from purchases/sales.
 * Plain JS so it runs in packaged Electron apps (no tsx required).
 */

const { PrismaClient } = require('@prisma/client');

const EPS = 1e-6;

async function rebuildStock(databaseUrl) {
  const prisma = new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined,
  );

  try {
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

    const events = [];

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

    events.sort((a, b) => {
      const da = a.date.getTime();
      const db = b.date.getTime();
      if (da !== db) return da - db;
      return a.type === b.type ? 0 : a.type === 'PURCHASE' ? -1 : 1;
    });

    const stockByProduct = new Map();
    const ledgerEntries = [];

    for (const ev of events) {
      const current = stockByProduct.get(ev.productTypeId) || { qtyKg: 0, avgCostPerKg: 0 };

      if (ev.type === 'PURCHASE') {
        const newQty = current.qtyKg + ev.qtyKg;
        const newAvg =
          newQty <= EPS
            ? 0
            : (current.qtyKg * current.avgCostPerKg + ev.qtyKg * ev.unitCostPerKg) / newQty;

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
      await prisma.stockPosition.createMany({ data: positionsData });
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

    return {
      positions: positionsData.length,
      ledgerEntries: ledgerEntries.length,
      purchases: purchases.length,
      sales: sales.length,
    };
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { rebuildStock };

if (require.main === module) {
  rebuildStock(process.env.DATABASE_URL)
    .then((result) => {
      console.log(
        '✅ rebuildStock: done',
        `positions=${result.positions}`,
        `ledgerEntries=${result.ledgerEntries}`,
      );
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
