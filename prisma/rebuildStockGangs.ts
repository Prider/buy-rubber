/**
 * Rebuild StockGang rows from StockLedgerEntry (all product types or one).
 *
 *   npx tsx prisma/rebuildStockGangs.ts
 *   PRODUCT_TYPE_ID=... npx tsx prisma/rebuildStockGangs.ts
 *   npm run db:rebuild-gangs
 */
import { PrismaClient } from '@prisma/client';
import { rebuildStockGangs } from '../src/lib/stock/stockGangs';

const prisma = new PrismaClient();

async function main() {
  const productTypeId = process.env.PRODUCT_TYPE_ID?.trim() || undefined;
  console.log(
    '🔁 rebuildStockGangs:',
    productTypeId ? `productTypeId=${productTypeId}` : 'all product types',
  );

  const result = await rebuildStockGangs(prisma, productTypeId);
  console.log(
    '✅ rebuildStockGangs: done',
    `productTypes=${result.productTypes}`,
    `gangs=${result.gangs}`,
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
