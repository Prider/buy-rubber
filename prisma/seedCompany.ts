/**
 * Seed 100,000 sample DestinationCompany rows (load / performance testing).
 * Run after main seed (optional — does not require other tables):
 *   npx tsx prisma/seedCompany.ts
 *   npm run db:seed:companies:for:test
 *
 * Codes use prefix L (L000001…) so they are easy to identify.
 * Clears previous L* load-test companies first (keeps real companies like C001).
 *
 * Optional:
 *   COUNT=50000 npm run db:seed:companies:for:test
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANY_COUNT = Math.max(1, parseInt(process.env.COUNT || '100000', 10) || 100_000);
const BATCH_SIZE = 1_000;
const CODE_PREFIX = 'L';

const NAME_PREFIXES = [
  'บริษัท',
  'ห้างหุ้นส่วนจำกัด',
  'หจก.',
  'โรงงาน',
  'ศูนย์',
] as const;

const NAME_SUFFIXES = [
  'ยางไทย',
  'รับซื้อยางใต้',
  'แปรรูปยาง',
  'ส่งออกยางพารา',
  'ลาเท็กซ์',
  'ยางคุณภาพ',
  'เอเชียนรับเบอร์',
  'ค้ายางคลองแห',
  'ยางสงขลา',
  'รับเบอร์โปร',
] as const;

function companyCode(index: number): string {
  return `${CODE_PREFIX}${String(index).padStart(6, '0')}`;
}

function companyName(index: number): string {
  const prefix = NAME_PREFIXES[index % NAME_PREFIXES.length];
  const suffix = NAME_SUFFIXES[index % NAME_SUFFIXES.length];
  return `${prefix} ${suffix} ${index}`;
}

async function main() {
  console.log(`🏢 seedCompany: สร้างบริษัทปลายทางตัวอย่าง ${COMPANY_COUNT.toLocaleString()} รายการ...`);

  // Remove previous load-test rows only (codes starting with L).
  // Detach sales first so FK does not block delete.
  const likePattern = `${CODE_PREFIX}%`;
  const detached = await prisma.$executeRaw`
    UPDATE "Sale"
    SET "destinationCompanyId" = NULL
    WHERE "destinationCompanyId" IN (
      SELECT id FROM "DestinationCompany" WHERE code LIKE ${likePattern}
    )
  `;
  console.log(`   - ถอดลิงก์จากรายการขาย: ${detached} แถว`);

  const deleted = await prisma.destinationCompany.deleteMany({
    where: { code: { startsWith: CODE_PREFIX } },
  });
  console.log(`   - ลบบริษัททดสอบเดิม (รหัส ${CODE_PREFIX}*): ${deleted.count} รายการ`);

  let createdCount = 0;

  for (let i = 0; i < COMPANY_COUNT; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, COMPANY_COUNT);
    const batchData = [];

    for (let j = i; j < batchEnd; j++) {
      const n = j + 1;
      batchData.push({
        code: companyCode(n),
        name: companyName(n),
        phone: j % 5 === 0 ? `08${String(10000000 + (j % 89999999)).slice(0, 8)}` : null,
        address: j % 3 === 0 ? `ที่อยู่ทดสอบ เลขที่ ${n} อ.หาดใหญ่ จ.สงขลา` : null,
        isActive: j % 20 !== 0, // ~5% inactive
      });
    }

    try {
      const result = await prisma.destinationCompany.createMany({ data: batchData });
      createdCount += result.count;
    } catch (error) {
      console.log(`   ⚠️  ข้ามรุ่น ${i + 1}–${batchEnd}:`, error);
    }

    console.log(`   ✓ สร้างบริษัทครบ ${batchEnd.toLocaleString()} / ${COMPANY_COUNT.toLocaleString()} รายการ`);
  }

  const active = await prisma.destinationCompany.count({ where: { isActive: true } });
  const total = await prisma.destinationCompany.count();
  console.log('✅ seedCompany เสร็จ:', createdCount.toLocaleString(), 'รายการทดสอบ');
  console.log(`   - รวมในระบบทั้งหมด: ${total.toLocaleString()} (ใช้งาน ${active.toLocaleString()})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
