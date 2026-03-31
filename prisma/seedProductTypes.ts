import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const totalToCreate = 100;
  let created = 0;
  let updated = 0;

  for (let i = 1; i <= totalToCreate; i++) {
    const code = `PT-${String(i).padStart(3, '0')}`;
    const name = `ประเภทสินค้า ${i}`;

    const result = await prisma.productType.upsert({
      where: { code },
      update: {
        name,
        description: `สร้างอัตโนมัติ #${i}`,
        isActive: true,
      },
      create: {
        code,
        name,
        description: `สร้างอัตโนมัติ #${i}`,
        isActive: true,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  const total = await prisma.productType.count();
  console.log(`✅ Done seeding product types. created=${created}, updated=${updated}, total=${total}`);
}

main()
  .catch((error) => {
    console.error('❌ seedProductTypes failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
