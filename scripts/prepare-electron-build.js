#!/usr/bin/env node

/**
 * Prepare a fresh prisma/dev.db for Electron packaging.
 * Customer seed (users + product types), then example sales and closed gangs.
 * Full load-test volumes stay on: npm run db:seed:sales:for:test / db:seed:gangs:for:test
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { writePackagedLicenseEnv } = require('../electron/loadEnv');

const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
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

console.log('📦 Preparing customer database for Electron packaging...');

try {
  const licenseEnvPath = writePackagedLicenseEnv(projectRoot);
  console.log('✓ Packaged license env:', licenseEnvPath);
} catch (error) {
  fail(error.message);
}

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

console.log('🧾 Seeding example sales...');
run('npm run db:seed:sales:for:test', { SALES: '50' });

console.log('📦 Seeding example gangs (ledger + matching sales)...');
run('npm run db:seed:gangs:for:test', { GANGS: '25' });

console.log('✅ Electron database ready for packaging (customer + example sales/gangs)');
