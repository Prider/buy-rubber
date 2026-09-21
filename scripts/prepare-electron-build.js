#!/usr/bin/env node

/**
 * Prepare prisma/dev.db for Electron packaging from the factory snapshot.
 * Copies prisma/backups/initial-data.db (users, product types, members;
 * no purchases/sales/stock), then syncs schema.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
const initialDataPath = path.join(projectRoot, 'prisma', 'backups', 'initial-data.db');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(projectRoot, 'prisma', 'schema.sqlite.prisma');
const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`;
const prismaEnv = { ...process.env, DATABASE_URL: dbUrl };

function run(command, extraEnv = {}) {
  execSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...prismaEnv, ...extraEnv },
  });
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

console.log('📦 Preparing factory database for Electron packaging...');

if (!fs.existsSync(sqliteSchemaPath)) {
  fail('prisma/schema.sqlite.prisma not found');
}

if (!fs.existsSync(initialDataPath)) {
  fail('prisma/backups/initial-data.db not found');
}

fs.copyFileSync(sqliteSchemaPath, schemaPath);
console.log('✓ schema.prisma → SQLite');

fs.copyFileSync(initialDataPath, dbPath);
console.log('✓ prisma/dev.db ← prisma/backups/initial-data.db');

run('npx prisma generate');
run('npx prisma db push');

console.log('✅ Electron database ready for packaging (factory initial-data snapshot)');
