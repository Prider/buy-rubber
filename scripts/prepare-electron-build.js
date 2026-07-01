#!/usr/bin/env node

/**
 * Prepare prisma/dev.db for Electron packaging without wiping existing data.
 * Use RESET_DB=1 to force a full re-seed via setup:sqlite.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
const prismaEnv = { ...process.env, DATABASE_URL: dbUrl };

function run(command) {
  execSync(command, { cwd: projectRoot, stdio: 'inherit', env: prismaEnv });
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const forceReset = process.env.RESET_DB === '1' || process.env.RESET_DB === 'true';

if (forceReset || !fs.existsSync(dbPath) || fs.statSync(dbPath).size < 1024) {
  console.log(forceReset ? '🔄 RESET_DB set — full SQLite setup...' : '📦 No database found — running full SQLite setup...');
  run('node scripts/setup-sqlite-local.js');
} else {
  console.log('📦 Preserving existing prisma/dev.db for Electron build');
  console.log(`   Size: ${(fs.statSync(dbPath).size / 1024 / 1024).toFixed(2)} MB`);

  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  const sqliteSchemaPath = path.join(projectRoot, 'prisma', 'schema.sqlite.prisma');
  if (fs.existsSync(sqliteSchemaPath)) {
    fs.copyFileSync(sqliteSchemaPath, schemaPath);
  }

  run('npx prisma generate');
  run('npx prisma db push');
  run('node scripts/prepare-electron-db.js');
}

console.log('✅ Electron database ready for packaging');
