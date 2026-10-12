/**
 * Seed ActivityLog rows for testing ประวัติการสร้าง แก้ไข และลบ.
 *
 * Inserts rows spread across the last N days (default 30) and attaches them
 * to existing users so the user / action / entity filters all have data.
 * Earlier rows from this script are replaced. Real history is left in place.
 *
 *   npm run db:seed:activity:for:test
 *   ACTIVITY_LOGS=50000 DAYS=30 npm run db:seed:activity:for:test
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_LABELS,
  ACTIVITY_ENTITY_TYPES,
  type ActivityAction,
  type ActivityEntityType,
} from '../src/lib/activityLogShared';

const SEED_ENTITY_PREFIX = 'seed-activity-';

function loadEnvFile(): void {
  if (process.env.DATABASE_URL) {
    return;
  }
  const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const prisma = new PrismaClient();

const RECORD_COUNT = Math.max(1, parseInt(process.env.ACTIVITY_LOGS || '50000', 10) || 50_000);
const DAYS = Math.max(1, parseInt(process.env.DAYS || '30', 10) || 30);
const BATCH_SIZE = 500;

const ENTITY_CODE_PREFIX: Record<ActivityEntityType, string> = {
  purchase: 'PUR',
  sale: 'SAL',
  member: 'M',
  destinationCompany: 'DC',
  productType: 'PT',
  expense: 'EXP',
  serviceFee: 'SF',
  reportGroup: 'RG',
  user: 'USR',
};

function pad(value: number, size: number): string {
  return String(value).padStart(size, '0');
}

function entityCode(entityType: ActivityEntityType, index: number, createdAt: Date): string {
  const prefix = ENTITY_CODE_PREFIX[entityType];
  const year = createdAt.getFullYear();
  const month = pad(createdAt.getMonth() + 1, 2);
  const seq = pad((index % 999999) + 1, 6);
  if (entityType === 'member' || entityType === 'user' || entityType === 'productType') {
    return `${prefix}${seq}`;
  }
  return `${prefix}-${year}${month}-${seq}`;
}

function changesFor(
  action: ActivityAction,
  entityType: ActivityEntityType,
  code: string,
  index: number,
): string {
  const amount = 1000 + (index % 9000);
  const weight = 50 + (index % 400);

  if (action === 'update') {
    return JSON.stringify({
      netWeight: { from: weight, to: weight + 12 },
      totalAmount: { from: amount, to: amount + 480 },
      notes: { from: null, to: `ปรับรายการทดสอบ ${index + 1}` },
    });
  }

  if (action === 'delete') {
    return JSON.stringify({
      code,
      netWeight: weight,
      totalAmount: amount,
      soft: entityType === 'member' || entityType === 'user',
    });
  }

  return JSON.stringify({
    code,
    netWeight: weight,
    totalAmount: amount,
  });
}

function buildRow(
  index: number,
  windowStartMs: number,
  windowMs: number,
  users: Array<{ id: string; username: string; role: string }>,
) {
  const action = ACTIVITY_ACTIONS[index % ACTIVITY_ACTIONS.length];
  const entityType = ACTIVITY_ENTITY_TYPES[Math.floor(index / ACTIVITY_ACTIONS.length) % ACTIVITY_ENTITY_TYPES.length];
  const user = users[index % users.length];
  const createdAt = new Date(windowStartMs + Math.floor((index / Math.max(1, RECORD_COUNT - 1)) * windowMs));
  const code = entityCode(entityType, index, createdAt);
  const entityName = ACTIVITY_ENTITY_LABELS[entityType];
  const verb = ACTIVITY_ACTION_LABELS[action];

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    action,
    entityType,
    entityId: `${SEED_ENTITY_PREFIX}${pad(index + 1, 7)}`,
    entityLabel: code,
    summary: `${verb}${entityName} ${code}`,
    changes: changesFor(action, entityType, code, index),
    createdAt,
  };
}

async function main() {
  console.log(
    `📝 seedActivityLog: สร้างประวัติตัวอย่าง ${RECORD_COUNT.toLocaleString()} รายการ ใน ${DAYS} วันล่าสุด`,
  );

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, role: true },
  });

  if (users.length === 0) {
    console.error('❌ ไม่พบผู้ใช้ในระบบ — รัน npm run db:seed ก่อน');
    process.exit(1);
  }

  const removed = await prisma.activityLog.deleteMany({
    where: { entityId: { startsWith: SEED_ENTITY_PREFIX } },
  });
  console.log(`   - ลบประวัติทดสอบเดิม: ${removed.count.toLocaleString()} รายการ`);

  const now = Date.now();
  const windowMs = DAYS * 24 * 60 * 60 * 1000;
  const windowStartMs = now - windowMs;
  let createdCount = 0;

  for (let start = 0; start < RECORD_COUNT; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, RECORD_COUNT);
    const batch = [];
    for (let index = start; index < end; index += 1) {
      batch.push(buildRow(index, windowStartMs, windowMs, users));
    }

    const result = await prisma.activityLog.createMany({ data: batch });
    createdCount += result.count;
    console.log(`   ✓ ${end.toLocaleString()} / ${RECORD_COUNT.toLocaleString()}`);
  }

  const [oldest, newest] = await Promise.all([
    prisma.activityLog.findFirst({
      where: { entityId: { startsWith: SEED_ENTITY_PREFIX } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.activityLog.findFirst({
      where: { entityId: { startsWith: SEED_ENTITY_PREFIX } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  console.log(`✅ seedActivityLog เสร็จ: ${createdCount.toLocaleString()} รายการ`);
  console.log(`   ผู้ใช้ที่ถูกอ้างอิง: ${users.map((user) => user.username).join(', ')}`);
  if (oldest && newest) {
    console.log(`   ช่วงเวลา: ${oldest.createdAt.toISOString()} → ${newest.createdAt.toISOString()}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
