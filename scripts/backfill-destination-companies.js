/**
 * Backfill DestinationCompany from distinct Sale.companyName values
 * and link existing sales via destinationCompanyId.
 *
 * Usage: node scripts/backfill-destination-companies.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function nextCode(existingCodes) {
  let max = 0;
  for (const code of existingCodes) {
    const m = /^C(\d+)$/.exec(code);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  let n = max + 1;
  while (existingCodes.has(`C${String(n).padStart(3, '0')}`)) n++;
  const code = `C${String(n).padStart(3, '0')}`;
  existingCodes.add(code);
  return code;
}

async function main() {
  const existing = await prisma.destinationCompany.findMany({ select: { id: true, code: true, name: true } });
  const codes = new Set(existing.map((c) => c.code));
  const byNameLower = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

  const sales = await prisma.sale.findMany({
    where: { destinationCompanyId: null },
    select: { id: true, companyName: true },
  });

  console.log(`Found ${sales.length} sales without destinationCompanyId`);

  let linked = 0;
  let created = 0;

  for (const sale of sales) {
    const name = (sale.companyName || '').trim();
    if (!name) continue;

    let company = byNameLower.get(name.toLowerCase());
    if (!company) {
      const code = await nextCode(codes);
      company = await prisma.destinationCompany.create({
        data: { code, name },
      });
      byNameLower.set(name.toLowerCase(), company);
      created++;
      console.log(`  Created ${code} - ${name}`);
    }

    await prisma.sale.update({
      where: { id: sale.id },
      data: { destinationCompanyId: company.id },
    });
    linked++;
  }

  console.log(`Done. Created ${created} companies, linked ${linked} sales.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
