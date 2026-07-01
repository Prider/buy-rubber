/**
 * Initialize database on first run
 * Copies seeded database from app bundle to userData if it doesn't exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { app } = require('electron');
const { rebuildStock } = require('./rebuild-stock');

/** Tables added in recent schema versions; existing installs may lack these. */
const REQUIRED_TABLES = ['Sale', 'StockPosition', 'StockLedgerEntry'];

// Create a debug log file to help troubleshoot database initialization
function debugLog(message) {
  try {
    const logPath = path.join(app.getPath('userData'), 'db-init-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    console.log(message);
  } catch (e) {
    console.error('Failed to write debug log:', e.message);
    console.log(message);
  }
}

function resolvePrismaProjectRoot() {
  const candidates = [
    app.getAppPath(),
    path.join(__dirname, '..'),
  ];
  for (const root of candidates) {
    if (fs.existsSync(path.join(root, 'prisma', 'schema.prisma'))) {
      return root;
    }
  }
  return path.join(__dirname, '..');
}

function buildPrismaDbPushCommand(projectRoot) {
  const prismaCliPath = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
  const prismaBinPath = path.join(projectRoot, 'node_modules', '.bin', 'prisma');
  if (fs.existsSync(prismaCliPath)) {
    return `node "${prismaCliPath}" db push --skip-generate`;
  }
  if (fs.existsSync(prismaBinPath)) {
    return `"${prismaBinPath}" db push --skip-generate`;
  }
  return 'npx prisma db push --skip-generate';
}

function runPrismaDbPush(dbUrl) {
  const projectRoot = resolvePrismaProjectRoot();
  const prismaCmd = buildPrismaDbPushCommand(projectRoot);
  debugLog('Running schema sync: ' + prismaCmd);
  debugLog('Prisma project root: ' + projectRoot);
  execSync(prismaCmd, {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'pipe',
  });
  debugLog('✅ Database schema synchronized via Prisma CLI');
}

async function getMissingTables(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'
  `;
  const existing = new Set((rows || []).map((row) => row.name));
  return REQUIRED_TABLES.filter((table) => !existing.has(table));
}

async function countPurchases(dbUrl) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    return await prisma.purchase.count();
  } catch {
    return 0;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function findBundledDatabasePath() {
  const appPath = app.getAppPath();
  const possibleDbPaths = [
    path.join(process.resourcesPath || appPath, 'prisma', 'dev.db'),
    path.join(appPath, 'prisma', 'dev.db'),
    path.join(appPath, '..', 'prisma', 'dev.db'),
    path.join(__dirname, '..', 'prisma', 'dev.db'),
  ];
  for (const dbPath of possibleDbPaths) {
    if (fs.existsSync(dbPath)) {
      return dbPath;
    }
  }
  return null;
}

async function maybeRefreshFromBundle(userDbPath, dbUrl) {
  const bundledDbPath = findBundledDatabasePath();
  if (!bundledDbPath) {
    debugLog('No bundled database found for refresh check');
    return false;
  }

  const normalizedBundled = bundledDbPath.replace(/\\/g, '/');
  const bundledUrl = `file:${normalizedBundled}`;
  const [userPurchases, bundledPurchases] = await Promise.all([
    countPurchases(dbUrl),
    countPurchases(bundledUrl),
  ]);

  debugLog(
    `Purchase count check: user=${userPurchases}, bundled=${bundledPurchases}`,
  );

  // Re-copy when user DB is stale (e.g. old install before seed data was bundled).
  if (userPurchases > 0 || bundledPurchases === 0) {
    return false;
  }

  const backupDir = path.join(path.dirname(userDbPath), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `dev.db.before-bundle-refresh.${stamp}`);
  fs.copyFileSync(userDbPath, backupPath);
  debugLog(`Backed up stale database to: ${backupPath}`);
  fs.copyFileSync(bundledDbPath, userDbPath);
  debugLog(`✅ Refreshed user database from bundle (${bundledPurchases} purchases)`);
  return true;
}

async function ensureExpenseUserColumns(prisma) {
  const columns = await prisma.$queryRaw`
    SELECT name FROM pragma_table_info('Expense') WHERE name = 'userId'
  `;
  if (columns && columns.length > 0) {
    return;
  }

  debugLog('Adding missing userId and userName columns to Expense table...');
  const alterStatements = [
    `ALTER TABLE Expense ADD COLUMN userId TEXT DEFAULT ''`,
    `ALTER TABLE Expense ADD COLUMN userName TEXT DEFAULT ''`,
  ];
  for (const sql of alterStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        debugLog('⚠️  Could not run: ' + sql + ' — ' + e.message);
      }
    }
  }
  try {
    await prisma.$executeRaw`UPDATE Expense SET userId = '' WHERE userId IS NULL`;
    await prisma.$executeRaw`UPDATE Expense SET userName = '' WHERE userName IS NULL`;
    debugLog('✅ Expense user columns updated');
  } catch (e) {
    debugLog('⚠️  Could not update Expense rows: ' + e.message);
  }
}

async function ensureSchemaUpToDate(dbUrl) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    const missingTables = await getMissingTables(prisma);
    if (missingTables.length > 0) {
      debugLog('Missing tables detected: ' + missingTables.join(', '));
      await prisma.$disconnect();
      runPrismaDbPush(dbUrl);
      return;
    }

    await ensureExpenseUserColumns(prisma);
    debugLog('✅ Database schema is up to date');
  } catch (error) {
    debugLog('⚠️  Schema check failed: ' + error.message);
    debugLog('⚠️  Attempting fallback: prisma db push...');
    try {
      runPrismaDbPush(dbUrl);
    } catch (pushError) {
      debugLog('⚠️  Prisma CLI fallback also failed: ' + pushError.message);
      debugLog('⚠️  Database may be missing recent schema changes');
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function ensureStockData(dbUrl) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    const [purchaseCount, positionCount] = await Promise.all([
      prisma.purchase.count(),
      prisma.stockPosition.count(),
    ]);

    if (purchaseCount === 0 || positionCount > 0) {
      debugLog(
        `Stock check: purchases=${purchaseCount}, positions=${positionCount} (no rebuild needed)`,
      );
      return;
    }

    debugLog(
      `Stock data missing (${purchaseCount} purchases, 0 positions). Rebuilding stock ledger...`,
    );
    const result = await rebuildStock(dbUrl);
    debugLog(
      `✅ Stock rebuilt: positions=${result.positions}, ledgerEntries=${result.ledgerEntries}`,
    );
  } catch (error) {
    debugLog('⚠️  Failed to rebuild stock: ' + error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function initializeDatabase() {
  return new Promise(async (resolve, reject) => {
    try {
      debugLog('=== DATABASE INITIALIZATION START ===');
      
      // Check if DATABASE_URL is already set (e.g., from .env file)
      // If it's a PostgreSQL URL, use it directly
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
        debugLog('PostgreSQL DATABASE_URL detected: ' + process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Mask password
        debugLog('Using PostgreSQL connection from environment variable');
        debugLog('=== DATABASE INITIALIZATION COMPLETE (PostgreSQL) ===');
        global.databasePath = null; // No file path for PostgreSQL
        resolve(null);
        return;
      }
      
      // Otherwise, use SQLite file-based database
      debugLog('Using SQLite file-based database');
      const userDataPath = app.getPath('userData');
      debugLog('userData path: ' + userDataPath);
      const userDbDir = path.join(userDataPath, 'prisma');
      const userDbPath = path.join(userDbDir, 'dev.db');
      debugLog('Target database path: ' + userDbPath);
      
      // Set DATABASE_URL environment variable for Prisma
      // This ensures Prisma client uses the correct database path
      // Normalize path: convert Windows backslashes to forward slashes
      const normalizedPath = userDbPath.replace(/\\/g, '/');
      // For Prisma SQLite, use file: prefix without encoding to avoid issues opening the file
      // Prisma expects unencoded absolute paths like file:/Users/... or file:C:/Users/...
      const dbUrl = `file:${normalizedPath}`;
      process.env.DATABASE_URL = dbUrl;
      debugLog('Set DATABASE_URL: ' + dbUrl);
      debugLog('Normalized path: ' + normalizedPath);
      debugLog('Original path: ' + userDbPath);
      
      // Also return the database path so it can be passed to the server
      global.databasePath = userDbPath;
      
      // Create prisma directory if it doesn't exist
      if (!fs.existsSync(userDbDir)) {
        fs.mkdirSync(userDbDir, { recursive: true });
        debugLog('✅ Created database directory: ' + userDbDir);
      } else {
        debugLog('Database directory already exists');
      }

      // If database already exists, ensure schema is up to date
      // Add missing columns using Prisma's raw SQL (works in packaged apps)
      if (fs.existsSync(userDbPath)) {
        const stats = fs.statSync(userDbPath);
        debugLog(`Database already exists: ${(stats.size / 1024).toFixed(2)} KB`);
        await maybeRefreshFromBundle(userDbPath, dbUrl);
        debugLog('Ensuring database schema is up to date...');
        await ensureSchemaUpToDate(dbUrl);

        await ensureStockData(dbUrl);
        
        debugLog('=== DATABASE INITIALIZATION COMPLETE ===');
        resolve(userDbPath);
        return;
      }
      
      debugLog('No existing database found, searching for source...');

      const sourceDbPath = findBundledDatabasePath();
      if (sourceDbPath) {
        debugLog('Found seeded database at: ' + sourceDbPath);
      } else {
        debugLog('Searching for seeded database in bundled paths — none found');
      }

      if (!sourceDbPath) {
        debugLog('❌ No seeded database found in any of the expected locations!');
        debugLog('This is a critical error. The app cannot function without a database.');
        debugLog('Please ensure prisma/dev.db is included in the build.');
        
        // Create a minimal valid SQLite3 database file
        // SQLite file format: https://www.sqlite.org/fileformat.html
        debugLog('Creating minimal empty SQLite database as fallback...');
        
        // Create a minimal valid SQLite database header (100 bytes)
        const header = Buffer.alloc(100, 0);
        header.write('SQLite format 3\0', 0, 'ascii'); // Magic header string (16 bytes)
        header.writeUInt16BE(4096, 16); // Page size (2 bytes) - 4096 is default
        header.writeUInt8(1, 18); // File format write version
        header.writeUInt8(1, 19); // File format read version
        header.writeUInt8(0, 20); // Bytes of unused reserved space at end of each page
        header.writeUInt8(64, 21); // Maximum embedded payload fraction
        header.writeUInt8(32, 22); // Minimum embedded payload fraction
        header.writeUInt8(32, 23); // Leaf payload fraction
        header.writeUInt32BE(0, 24); // File change counter
        header.writeUInt32BE(1, 28); // Size of database in pages
        header.writeUInt32BE(0, 32); // Page number of first freelist trunk page
        header.writeUInt32BE(0, 36); // Total number of freelist pages
        header.writeUInt32BE(0, 40); // Schema cookie
        header.writeUInt32BE(4, 44); // Schema format number (4 = latest)
        header.writeUInt32BE(0, 48); // Default page cache size
        header.writeUInt32BE(0, 52); // Page number of largest root b-tree page
        header.writeUInt32BE(1, 56); // Database text encoding (1 = UTF-8)
        header.writeUInt32BE(0, 60); // User version
        header.writeUInt32BE(0, 64); // Incremental vacuum mode
        header.writeUInt32BE(0, 68); // Application ID
        // Bytes 72-91 are reserved (already filled with 0)
        header.writeUInt32BE(0, 92); // Version-valid-for number
        header.writeUInt32BE(3046000, 96); // SQLite version number
        
        // Write the header and create a minimal first page (4096 bytes)
        const firstPage = Buffer.alloc(4096, 0);
        header.copy(firstPage, 0, 0, 100);
        
        fs.writeFileSync(userDbPath, firstPage);
        debugLog('⚠️  Created minimal SQLite database file');
        debugLog('⚠️  This database is empty and will need schema initialization');
        debugLog('⚠️  Prisma will fail to connect. YOU MUST include prisma/dev.db in the build!');
        
        resolve(userDbPath);
        return;
      }

      // Copy the seeded database to userData
      debugLog('Copying seeded database...');
      debugLog('  From: ' + sourceDbPath);
      debugLog('  To: ' + userDbPath);
      fs.copyFileSync(sourceDbPath, userDbPath);
      
      const stats = fs.statSync(userDbPath);
      debugLog(`✅ Database copied successfully: ${(stats.size / 1024).toFixed(2)} KB`);
      debugLog('Database location: ' + userDbPath);
      
      // Ensure schema is up to date after copying
      debugLog('Ensuring database schema is up to date...');
      await ensureSchemaUpToDate(dbUrl);

      await ensureStockData(dbUrl);
      
      debugLog('=== DATABASE INITIALIZATION COMPLETE ===');
      
      resolve(userDbPath);
    } catch (error) {
      debugLog('=== DATABASE INITIALIZATION FAILED ===');
      debugLog('❌ Error: ' + error.message);
      debugLog('Stack: ' + error.stack);
      reject(error);
    }
  });
}

module.exports = { initializeDatabase };

