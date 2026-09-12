/**
 * Reset operational data to a first-day empty state.
 * Keeps users, members, product types, companies, prices, expenses, and settings.
 *
 *   npx tsx prisma/resetFirstDay.ts
 *   npm run db:reset:first-day
 *   yarn db:reset:first-day
 *
 * Deletes:
 *   ServiceFee, Purchase, StockGang, StockLedgerEntry, StockPosition,
 *   SaleExpense, Sale
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countRows() {
  const [purchases, serviceFees, ledger, positions, gangs, sales, saleExpenses] =
    await Promise.all([
      prisma.purchase.count(),
      prisma.serviceFee.count(),
      prisma.stockLedgerEntry.count(),
      prisma.stockPosition.count(),
      prisma.stockGang.count(),
      prisma.sale.count(),
      prisma.saleExpense.count(),
    ]);

  return { purchases, serviceFees, ledger, positions, gangs, sales, saleExpenses };
}

async function main() {
  console.log('🧹 resetFirstDay: clearing purchases, service fees, sales, and stock...');

  const before = await countRows();
  console.log('   before:', before);

  const deleted = await prisma.$transaction(async (tx) => {
    const serviceFees = await tx.serviceFee.deleteMany({});
    const purchases = await tx.purchase.deleteMany({});
    const gangs = await tx.stockGang.deleteMany({});
    const ledger = await tx.stockLedgerEntry.deleteMany({});
    const positions = await tx.stockPosition.deleteMany({});
    const saleExpenses = await tx.saleExpense.deleteMany({});
    const sales = await tx.sale.deleteMany({});

    return {
      serviceFees: serviceFees.count,
      purchases: purchases.count,
      gangs: gangs.count,
      ledger: ledger.count,
      positions: positions.count,
      saleExpenses: saleExpenses.count,
      sales: sales.count,
    };
  });

  const after = await countRows();

  console.log('   deleted:', deleted);
  console.log('   after:', after);
  console.log('✅ resetFirstDay: done (members, users, product types, companies kept)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
