#!/usr/bin/env node

/**
 * Migrate an old SQLite backup (dev.db) to the current schema, then optionally
 * install it into the Electron app's userData database.
 *
 * Works on Windows, macOS, and Linux. Close the Electron app before --install.
 *
 * Windows (PowerShell or cmd):
 *
 *   npm run db:migrate:old -- --source "D:\backups\old-dev.db" --install
 *
 *   npm run db:migrate:old -- --source "D:\backups\old-dev.db" --dry-run
 *
 *   npm run db:migrate:old -- --source "D:\backups\old-dev.db" --target "D:\out\dev.db"
 *
 * macOS / Linux:
 *
 *   npm run db:migrate:old -- --source /path/to/old/dev.db --install
 *
 * Aligns old DBs with the current schema:
 *   - additive tables (DestinationCompany, SaleExpense, StockGang, report groups)
 *   - Sale.destinationCompanyId / unitCostPerKg / costOfGoods
 *   - backfill companies, sale expense lines, stock ledger/gangs, sale COGS
 *
 * Options:
 *   --source <path>   Required. Old prisma/dev.db (or backup file)
 *   --target <path>   Optional. Where to write the migrated DB
 *   --install         Install into default Electron userData path
 *   --dry-run         Inspect + migrate in temp only (do not write target)
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const USER_DATA_DIR_NAME = 'pos.punsook.innotech';
const isWindows = process.platform === 'win32';

const REQUIRED_TABLES = [
  'User',
  'Member',
  'DestinationCompany',
  'ProductType',
  'Purchase',
  'Expense',
  'ServiceFee',
  'Setting',
  'Backup',
  'Sale',
  'SaleExpense',
  'StockPosition',
  'StockLedgerEntry',
  'StockGang',
  'ProductPrice',
  'ReportProductTypeGroup',
  'ReportProductTypeGroupMember',
];

/** Columns that may be missing on older DBs (added with safe defaults). */
const COMPAT_COLUMNS = {
  Expense: [
    { name: 'userId', sql: `ALTER TABLE Expense ADD COLUMN userId TEXT DEFAULT ''` },
    { name: 'userName', sql: `ALTER TABLE Expense ADD COLUMN userName TEXT DEFAULT ''` },
  ],
  Member: [
    { name: 'tapperId', sql: `ALTER TABLE Member ADD COLUMN tapperId TEXT` },
    { name: 'tapperName', sql: `ALTER TABLE Member ADD COLUMN tapperName TEXT` },
    { name: 'advanceBalance', sql: `ALTER TABLE Member ADD COLUMN advanceBalance REAL DEFAULT 0` },
  ],
  Sale: [
    { name: 'expenseType', sql: `ALTER TABLE Sale ADD COLUMN expenseType TEXT` },
    { name: 'expenseCost', sql: `ALTER TABLE Sale ADD COLUMN expenseCost REAL` },
    { name: 'destinationCompanyId', sql: `ALTER TABLE Sale ADD COLUMN destinationCompanyId TEXT` },
    { name: 'unitCostPerKg', sql: `ALTER TABLE Sale ADD COLUMN unitCostPerKg REAL` },
    { name: 'costOfGoods', sql: `ALTER TABLE Sale ADD COLUMN costOfGoods REAL` },
    { name: 'notes', sql: `ALTER TABLE Sale ADD COLUMN notes TEXT` },
  ],
  StockLedgerEntry: [
    { name: 'refId', sql: `ALTER TABLE StockLedgerEntry ADD COLUMN refId TEXT` },
  ],
  Purchase: [
    { name: 'bonusPrice', sql: `ALTER TABLE Purchase ADD COLUMN bonusPrice REAL DEFAULT 0` },
    { name: 'notes', sql: `ALTER TABLE Purchase ADD COLUMN notes TEXT` },
    { name: 'isPaid', sql: `ALTER TABLE Purchase ADD COLUMN isPaid INTEGER DEFAULT 0` },
  ],
};

function log(msg) {
  console.log(msg);
}

function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

/** Strip wrapping quotes Windows shells sometimes leave on args. */
function cleanPathArg(value) {
  if (!value) return value;
  let v = String(value).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

function parseArgs(argv) {
  const args = { source: null, target: null, install: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') args.source = cleanPathArg(argv[++i]);
    else if (a === '--target') args.target = cleanPathArg(argv[++i]);
    else if (a === '--install') args.install = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  log(`
Migrate old SQLite DB to current schema (Windows / macOS / Linux)

Usage:
  npm run db:migrate:old -- --source <old-dev.db> [--install | --target <path>] [--dry-run]

Windows examples:
  npm run db:migrate:old -- --source "D:\\backups\\old-dev.db" --install
  npm run db:migrate:old -- --source "D:\\backups\\old-dev.db" --dry-run

Default install path on Windows:
  %APPDATA%\\${USER_DATA_DIR_NAME}\\prisma\\dev.db

Close the Electron app before using --install.
`);
}

function defaultElectronDbPath() {
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      USER_DATA_DIR_NAME,
      'prisma',
      'dev.db',
    );
  }
  if (isWindows) {
    const appData =
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, USER_DATA_DIR_NAME, 'prisma', 'dev.db');
  }
  return path.join(os.homedir(), '.config', USER_DATA_DIR_NAME, 'prisma', 'dev.db');
}

function stamp() {
  // Avoid ":" which is illegal in Windows filenames
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function assertSqliteFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Source not found: ${filePath}`);
  }
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
  } catch (e) {
    if (e && (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES')) {
      fail(
        `Cannot read source (file locked). Close any app using it, then retry.\n  ${filePath}\n  ${e.message}`,
      );
    }
    throw e;
  }
  const buf = Buffer.alloc(16);
  fs.readSync(fd, buf, 0, 16, 0);
  fs.closeSync(fd);
  const header = buf.toString('utf8');
  if (!header.startsWith('SQLite format 3')) {
    fail(`Not a SQLite database: ${filePath}`);
  }
}

function copyFileSafe(src, dest) {
  try {
    fs.copyFileSync(src, dest);
  } catch (e) {
    if (e && (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES')) {
      fail(
        `File is locked (common on Windows if the app is still open).\n  Close Electron / DB tools, then retry.\n  ${src}\n  ${e.message}`,
      );
    }
    throw e;
  }
}

function copySqliteBundle(sourceDb, destDb) {
  fs.mkdirSync(path.dirname(destDb), { recursive: true });
  copyFileSafe(sourceDb, destDb);
  for (const suffix of ['-wal', '-shm']) {
    const side = sourceDb + suffix;
    if (fs.existsSync(side)) {
      copyFileSafe(side, destDb + suffix);
    }
  }
}

/**
 * Prisma SQLite URL — use forward slashes on all platforms.
 * Windows example: file:C:/Users/Name/AppData/Local/Temp/.../dev.db
 */
function toFileUrl(dbPath) {
  const absolute = path.resolve(dbPath).replace(/\\/g, '/');
  return `file:${absolute}`;
}

function ensureSqliteSchema() {
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  const sqliteSchemaPath = path.join(projectRoot, 'prisma', 'schema.sqlite.prisma');
  if (!fs.existsSync(sqliteSchemaPath)) {
    fail('prisma/schema.sqlite.prisma not found');
  }
  fs.copyFileSync(sqliteSchemaPath, schemaPath);
  log('[OK] schema.prisma -> SQLite');
}

/**
 * Run Prisma CLI without a shell string (Windows-safe: no npx.cmd issues).
 */
function runPrisma(args, dbUrl) {
  const prismaCli = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
  const env = { ...process.env, DATABASE_URL: dbUrl };

  if (fs.existsSync(prismaCli)) {
    const result = spawnSync(process.execPath, [prismaCli, ...args], {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new Error(`prisma ${args.join(' ')} failed with exit ${result.status}`);
    }
    return;
  }

  // Fallback: npx.cmd on Windows needs shell
  const npxCmd = isWindows ? 'npx.cmd' : 'npx';
  const result = spawnSync(npxCmd, ['prisma', ...args], {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
    shell: isWindows,
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`npx prisma ${args.join(' ')} failed with exit ${result.status}`);
  }
}

async function createPrisma(dbUrl) {
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient({ datasources: { db: { url: dbUrl } } });
}

async function listTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'
    ORDER BY name
  `);
  return (rows || []).map((r) => r.name);
}

async function listColumns(prisma, table) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info('${table}')`);
  return new Set((rows || []).map((r) => r.name));
}

async function applyCompatColumns(prisma) {
  const tables = await listTables(prisma);
  const tableSet = new Set(tables);
  const added = [];

  for (const [table, cols] of Object.entries(COMPAT_COLUMNS)) {
    if (!tableSet.has(table)) continue;
    const existing = await listColumns(prisma, table);
    for (const col of cols) {
      if (existing.has(col.name)) continue;
      try {
        await prisma.$executeRawUnsafe(col.sql);
        added.push(`${table}.${col.name}`);
        log(`  + added ${table}.${col.name}`);
      } catch (e) {
        if (!String(e.message || e).includes('duplicate column')) {
          log(`  [WARN] could not add ${table}.${col.name}: ${e.message}`);
        }
      }
    }
  }

  if (tableSet.has('Expense')) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE Expense SET userId = COALESCE(userId, '') WHERE userId IS NULL`,
      );
      await prisma.$executeRawUnsafe(
        `UPDATE Expense SET userName = COALESCE(userName, '') WHERE userName IS NULL`,
      );
    } catch {
      // ignore if columns still missing
    }
  }

  return added;
}

async function integrityCheck(prisma) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA integrity_check`);
  const ok =
    rows &&
    rows[0] &&
    (rows[0].integrity_check === 'ok' || rows[0].integrity_check === 'Ok');
  return { ok: !!ok, detail: rows };
}

async function countSafe(prisma, model) {
  try {
    return await prisma[model].count();
  } catch {
    return null;
  }
}

async function reportCounts(prisma, label) {
  const models = [
    'user',
    'member',
    'destinationCompany',
    'productType',
    'purchase',
    'sale',
    'saleExpense',
    'expense',
    'serviceFee',
    'stockPosition',
    'stockLedgerEntry',
    'stockGang',
    'reportProductTypeGroup',
  ];
  log(`\n[COUNTS] ${label}:`);
  for (const m of models) {
    const n = await countSafe(prisma, m);
    log(`   ${m}: ${n === null ? 'n/a' : n}`);
  }
}

function nextCompanyCode(existingCodes) {
  let max = 0;
  for (const code of existingCodes) {
    const m = /^C(\d+)$/.exec(code);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  let n = max + 1;
  while (existingCodes.has(`C${String(n).padStart(3, '0')}`)) n += 1;
  const code = `C${String(n).padStart(3, '0')}`;
  existingCodes.add(code);
  return code;
}

/**
 * Create DestinationCompany rows from distinct Sale.companyName values
 * and set Sale.destinationCompanyId.
 */
async function backfillDestinationCompanies(prisma) {
  const existing = await prisma.destinationCompany.findMany({
    select: { id: true, code: true, name: true },
  });
  const codes = new Set(existing.map((c) => c.code));
  const byNameLower = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

  const nameRows = await prisma.$queryRawUnsafe(`
    SELECT TRIM(companyName) AS name
    FROM Sale
    WHERE destinationCompanyId IS NULL
      AND companyName IS NOT NULL
      AND TRIM(companyName) != ''
    GROUP BY TRIM(companyName)
  `);

  let created = 0;
  let linked = 0;

  for (const row of nameRows || []) {
    const name = String(row.name || '').trim();
    if (!name) continue;

    let company = byNameLower.get(name.toLowerCase());
    if (!company) {
      company = await prisma.destinationCompany.create({
        data: { code: nextCompanyCode(codes), name },
      });
      byNameLower.set(name.toLowerCase(), company);
      created += 1;
    }

    const updated = await prisma.$executeRawUnsafe(
      `UPDATE Sale
       SET destinationCompanyId = ?
       WHERE destinationCompanyId IS NULL
         AND LOWER(TRIM(companyName)) = LOWER(?)`,
      company.id,
      name,
    );
    linked += Number(updated) || 0;
  }

  log(`  companies created=${created}, sales linked=${linked}`);
  return { created, linked };
}

/**
 * Create SaleExpense lines from legacy Sale.expenseType / expenseCost.
 */
async function backfillSaleExpenses(prisma) {
  const sales = await prisma.$queryRawUnsafe(`
    SELECT s.id AS id, s.expenseType AS expenseType, s.expenseCost AS expenseCost, s.notes AS notes
    FROM Sale s
    WHERE NOT EXISTS (SELECT 1 FROM SaleExpense e WHERE e.saleId = s.id)
      AND (
        (s.expenseCost IS NOT NULL AND s.expenseCost > 0)
        OR (s.expenseType IS NOT NULL AND TRIM(s.expenseType) != '')
      )
  `);

  const rows = (sales || []).map((sale) => ({
    id: crypto.randomUUID(),
    saleId: sale.id,
    type: (sale.expenseType && String(sale.expenseType).trim()) || 'อื่นๆ',
    amount: Number(sale.expenseCost) > 0 ? Number(sale.expenseCost) : 0,
    note: sale.notes ? String(sale.notes) : null,
    sortOrder: 0,
  }));

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await prisma.saleExpense.createMany({ data: rows.slice(i, i + chunkSize) });
  }

  log(`  sale expenses created=${rows.length}`);
  return { created: rows.length };
}

/**
 * Copy unitCostPerKg / costOfGoods from rebuilt SALE ledger rows onto Sale.
 */
async function backfillSaleCogs(prisma) {
  const ledger = await prisma.stockLedgerEntry.findMany({
    where: { refType: 'SALE', refNo: { not: null } },
    select: { refNo: true, unitCostPerKg: true, totalCost: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const bySaleNo = new Map();
  for (const entry of ledger) {
    if (!entry.refNo || bySaleNo.has(entry.refNo)) continue;
    bySaleNo.set(entry.refNo, {
      unitCostPerKg: entry.unitCostPerKg,
      totalCost: entry.totalCost,
    });
  }

  const saleNos = [...bySaleNo.keys()];
  const chunkSize = 500;
  let updated = 0;

  for (let i = 0; i < saleNos.length; i += chunkSize) {
    const chunk = saleNos.slice(i, i + chunkSize);
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
  }

  log(`  sales with COGS updated=${updated}`);
  return { updated };
}

async function main() {
  // Help Windows consoles print Unicode paths more reliably when possible
  if (isWindows) {
    try {
      if (process.stdout.setDefaultEncoding) {
        process.stdout.setDefaultEncoding('utf8');
      }
    } catch {
      // ignore
    }
  }

  const args = parseArgs(process.argv.slice(2));
  if (!args.source) {
    printHelp();
    fail('Missing --source <path-to-old-dev.db>');
  }

  const sourcePath = path.resolve(args.source);
  assertSqliteFile(sourcePath);

  let targetPath = args.target ? path.resolve(args.target) : null;
  if (args.install) {
    targetPath = defaultElectronDbPath();
  }
  if (!targetPath) {
    targetPath = path.join(
      path.dirname(sourcePath),
      `dev.migrated.${stamp()}.db`,
    );
  }

  log('========================================');
  log('Migrate old SQLite DB -> current schema');
  log(`Platform: ${process.platform}`);
  log('========================================');
  log(`Source:  ${sourcePath}`);
  log(`Target:  ${targetPath}`);
  log(`Install: ${args.install ? 'yes (Electron userData)' : 'no'}`);
  log(`Dry-run: ${args.dryRun ? 'yes' : 'no'}`);
  log('');

  if (args.install) {
    log('[WARN] Close the Electron app before installing into userData.\n');
  }

  ensureSqliteSchema();

  const workDir = path.join(os.tmpdir(), `biglatex-migrate-${stamp()}`);
  fs.mkdirSync(workDir, { recursive: true });
  const workDb = path.join(workDir, 'dev.db');
  copySqliteBundle(sourcePath, workDb);
  log(`[OK] Working copy: ${workDb}`);

  const dbUrl = toFileUrl(workDb);

  log('\nStep 1: Generate Prisma client...');
  runPrisma(['generate'], dbUrl);

  let prisma = await createPrisma(dbUrl);
  try {
    const beforeTables = await listTables(prisma);
    log(`\nStep 2: Tables before migration (${beforeTables.length}):`);
    log(`   ${beforeTables.join(', ') || '(none)'}`);

    const missing = REQUIRED_TABLES.filter((t) => !beforeTables.includes(t));
    if (missing.length) {
      log(`   Missing (will be added): ${missing.join(', ')}`);
    }

    const integrityBefore = await integrityCheck(prisma);
    if (!integrityBefore.ok) {
      fail(`Source integrity_check failed: ${JSON.stringify(integrityBefore.detail)}`);
    }
    log('[OK] integrity_check: ok');

    await reportCounts(prisma, 'before');

    log('\nStep 3: Apply compatibility column patches...');
    await applyCompatColumns(prisma);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  log('\nStep 4: Sync schema with prisma db push...');
  try {
    runPrisma(['db', 'push', '--skip-generate'], dbUrl);
  } catch {
    log('[WARN] db push needs --accept-data-loss (additive/repair drift)...');
    runPrisma(['db', 'push', '--skip-generate', '--accept-data-loss'], dbUrl);
  }

  prisma = await createPrisma(dbUrl);
  try {
    log('\nStep 5: Re-apply compatibility patches (after push)...');
    await applyCompatColumns(prisma);

    const afterTables = await listTables(prisma);
    const stillMissing = REQUIRED_TABLES.filter((t) => !afterTables.includes(t));
    if (stillMissing.length) {
      fail(`Schema sync incomplete. Still missing: ${stillMissing.join(', ')}`);
    }
    log(`[OK] All required tables present (${afterTables.length} tables)`);

    await reportCounts(prisma, 'after schema sync');

    log('\nStep 6: Backfill destination companies from Sale.companyName...');
    await backfillDestinationCompanies(prisma);

    log('\nStep 7: Backfill SaleExpense from legacy expenseType/expenseCost...');
    await backfillSaleExpenses(prisma);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  log('\nStep 8: Rebuild stock ledger, positions, and gangs...');
  const { rebuildStock } = require(path.join(projectRoot, 'electron', 'rebuild-stock.js'));
  const stockResult = await rebuildStock(dbUrl);
  log(
    `[OK] Stock rebuilt: positions=${stockResult.positions}, ledger=${stockResult.ledgerEntries}, gangs=${stockResult.gangs ?? 0}, purchases=${stockResult.purchases}, sales=${stockResult.sales}`,
  );

  prisma = await createPrisma(dbUrl);
  try {
    log('\nStep 9: Backfill Sale unitCostPerKg / costOfGoods from ledger...');
    await backfillSaleCogs(prisma);

    const integrityAfter = await integrityCheck(prisma);
    if (!integrityAfter.ok) {
      fail(`Migrated DB integrity_check failed: ${JSON.stringify(integrityAfter.detail)}`);
    }
    log('[OK] integrity_check: ok');
    await reportCounts(prisma, 'final');
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  for (const suffix of ['-wal', '-shm']) {
    const p = workDb + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  if (args.dryRun) {
    log('\n[OK] Dry-run complete. Migrated working copy left at:');
    log(`   ${workDb}`);
    log('   (target was NOT overwritten)');
    return;
  }

  if (fs.existsSync(targetPath)) {
    const backupDir = path.join(path.dirname(targetPath), 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(
      backupDir,
      `dev.db.before-migrate.${stamp()}`,
    );
    copyFileSafe(targetPath, backupPath);
    log(`\n[OK] Existing target backed up -> ${backupPath}`);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSafe(workDb, targetPath);
  for (const suffix of ['-wal', '-shm']) {
    const p = targetPath + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  const sourceBackupDir = path.join(path.dirname(sourcePath), 'migration-backups');
  fs.mkdirSync(sourceBackupDir, { recursive: true });
  const sourceBackup = path.join(
    sourceBackupDir,
    `source.${stamp()}${path.extname(sourcePath) || '.db'}`,
  );
  copyFileSafe(sourcePath, sourceBackup);

  log('\n========================================');
  log('[OK] Migration complete');
  log('========================================');
  log(`Migrated DB: ${targetPath}`);
  log(`Source copy: ${sourceBackup}`);
  if (args.install) {
    log('\nNext: open the Electron app — it will use this database.');
    if (isWindows) {
      log(`Path: %APPDATA%\\${USER_DATA_DIR_NAME}\\prisma\\dev.db`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
