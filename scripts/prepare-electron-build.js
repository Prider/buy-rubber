#!/usr/bin/env node

/**
 * Prepare a fresh prisma/dev.db for Electron packaging.
 * Always uses the customer seed (users + product types only — no purchases/sales).
 * Demo/dev data stays on: npm run setup:sqlite / npm run db:seed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(projectRoot, 'prisma', 'schema.sqlite.prisma');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
const prismaEnv = { ...process.env, DATABASE_URL: dbUrl };

function run(command) {
  execSync(command, { cwd: projectRoot, stdio: 'inherit', env: prismaEnv });
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

console.log('📦 Preparing customer database for Electron packaging...');

if (!fs.existsSync(sqliteSchemaPath)) {
  fail('prisma/schema.sqlite.prisma not found');
}

fs.copyFileSync(sqliteSchemaPath, schemaPath);
console.log('✓ schema.prisma → SQLite');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ Removed previous prisma/dev.db');
}

run('npx prisma generate');
run('npx prisma db push');
run('npm run db:seed:customer');

console.log('🔁 Rebuilding stock ledger (expected empty for customer seed)...');
run('node electron/rebuild-stock.js');

console.log('✅ Electron database ready for packaging (customer seed)');
