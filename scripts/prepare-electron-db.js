#!/usr/bin/env node

/**
 * Prepare prisma/dev.db for Electron packaging.
 * Ensures stock positions/ledger are rebuilt from purchases before bundling.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function main() {
  console.log('📦 Preparing database for Electron build...');

  if (!fs.existsSync(dbPath)) {
    fail('prisma/dev.db not found. Run "npm run setup:sqlite" first.');
  }

  const stats = fs.statSync(dbPath);
  console.log(`   Database: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  if (stats.size < 1024) {
    const legacyPath = path.join(projectRoot, 'prisma', 'prisma', 'dev.db');
    if (fs.existsSync(legacyPath) && fs.statSync(legacyPath).size > 1024) {
      fail(
        'prisma/dev.db is empty but data exists at prisma/prisma/dev.db. ' +
          'Run "npm run setup:sqlite" to fix the DATABASE_URL path.',
      );
    }
    fail('prisma/dev.db is empty or too small. Run "npm run setup:sqlite" first.');
  }

  console.log('🔁 Rebuilding stock ledger...');
  try {
    execSync('node electron/rebuild-stock.js', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
    });
  } catch {
    fail('Stock rebuild failed. Fix errors above and retry the build.');
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    const [purchaseCount, positionCount, ledgerCount] = await Promise.all([
      prisma.purchase.count(),
      prisma.stockPosition.count(),
      prisma.stockLedgerEntry.count(),
    ]);

    console.log(`   Purchases: ${purchaseCount}`);
    console.log(`   Stock positions: ${positionCount}`);
    console.log(`   Ledger entries: ${ledgerCount}`);

    if (purchaseCount > 0 && positionCount === 0) {
      fail('Database has purchases but no stock positions after rebuild.');
    }

    if (purchaseCount > 0 && ledgerCount === 0) {
      fail('Database has purchases but no stock ledger entries after rebuild.');
    }

    console.log('✅ Database ready for Electron packaging');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  fail(error.message);
});
