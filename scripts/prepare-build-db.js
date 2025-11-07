/**
 * Prepare database for build
 * This script seeds the database before packaging
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Preparing database for build...');

// Ensure database exists
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const prismaPath = path.join(__dirname, '..', 'prisma');

// Step 1: Push schema to ensure database exists
console.log('📝 Pushing database schema...');
try {
  execSync('npx prisma db push --accept-data-loss', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Failed to push schema:', error);
  process.exit(1);
}

// Step 2: Seed the database
console.log('🌱 Seeding database...');
try {
  execSync('npm run db:seed', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Failed to seed database:', error);
  process.exit(1);
}

// Step 3: Verify database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found after seeding:', dbPath);
  process.exit(1);
}

const stats = fs.statSync(dbPath);
console.log(`✅ Database ready: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('✅ Database preparation complete!');


