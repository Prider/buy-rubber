#!/usr/bin/env node

/**
 * Cross-platform script to setup SQLite for local development
 * Works on both Windows and macOS/Linux
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
/* eslint-enable @typescript-eslint/no-require-imports */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

/* eslint-disable no-console */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}
/* eslint-enable no-console */

function exec(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch {
    return false;
  }
}

const projectRoot = process.cwd();
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(projectRoot, 'prisma', 'schema.sqlite.prisma');
const envPath = path.join(projectRoot, '.env');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');

log('========================================', 'cyan');
log('Setting up SQLite for Local Development', 'cyan');
log('========================================', 'cyan');
log('');

// Step 1: Backup current schema if it's PostgreSQL
log('Step 1: Checking current schema...', 'yellow');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
const isPostgres = schemaContent.includes('provider = "postgresql"');
const isSqlite = schemaContent.includes('provider = "sqlite"');

if (isPostgres) {
  log('  Current schema uses PostgreSQL', 'yellow');
  log('  Creating backup: prisma/schema.postgres.prisma', 'yellow');
  fs.writeFileSync(
    path.join(projectRoot, 'prisma', 'schema.postgres.prisma'),
    schemaContent
  );
} else if (isSqlite) {
  log('  Schema already uses SQLite', 'green');
} else {
  log('  ⚠️  Could not detect database provider', 'yellow');
}

// Step 2: Update schema to use SQLite
log('');
log('Step 2: Updating schema to use SQLite...', 'yellow');

// Use SQLite schema file if it exists, otherwise convert current schema
if (fs.existsSync(sqliteSchemaPath)) {
  log('  Found schema.sqlite.prisma, using it...', 'yellow');
  schemaContent = fs.readFileSync(sqliteSchemaPath, 'utf8');
  fs.writeFileSync(schemaPath, schemaContent);
  log('  ✓ Schema updated to use SQLite (from schema.sqlite.prisma)', 'green');
} else {
  log('  Converting PostgreSQL schema to SQLite...', 'yellow');
  // Replace PostgreSQL provider with SQLite
  schemaContent = schemaContent.replace(
    /provider\s*=\s*"postgresql"/g,
    'provider = "sqlite"'
  );
  // Write updated schema
  fs.writeFileSync(schemaPath, schemaContent);
  log('  ✓ Schema updated to use SQLite', 'green');
}

// Step 3: Create/Update .env file
log('');
log('Step 3: Creating/updating .env file...', 'yellow');

const envContent = `# Local Development with SQLite
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret
JWT_SECRET="your-secret-key-change-this-in-production"

# App
NEXT_PUBLIC_APP_NAME="BigLatex-Pro"
NEXT_PUBLIC_APP_VERSION="1.0.0"

NODE_ENV="development"
SKIP_ENV_VALIDATION="true"
`;

// Backup existing .env if it exists
if (fs.existsSync(envPath)) {
  const backupPath = path.join(projectRoot, '.env.backup');
  log(`  Backing up existing .env to .env.backup`, 'yellow');
  fs.copyFileSync(envPath, backupPath);
}

fs.writeFileSync(envPath, envContent);
log('  ✓ .env file created/updated for SQLite', 'green');

// Step 4: Remove old database file if exists
log('');
log('Step 4: Cleaning up old database...', 'yellow');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  log('  ✓ Removed old database file', 'green');
} else {
  log('  ✓ No existing database file', 'green');
}

// Step 5: Fix Prisma binary permissions (Unix systems)
log('');
log('Step 5: Fixing Prisma binary permissions...', 'yellow');
const prismaBinPath = path.join(projectRoot, 'node_modules', '.bin', 'prisma');
if (fs.existsSync(prismaBinPath)) {
  try {
    fs.chmodSync(prismaBinPath, 0o755); // Make executable
    log('  ✓ Prisma binary permissions fixed', 'green');
  } catch {
    // Ignore if chmod fails (Windows doesn't need it)
    log('  ⚠️  Could not set permissions (may be Windows)', 'yellow');
  }
} else {
  log('  ⚠️  Prisma binary not found, will install dependencies first', 'yellow');
}

// Step 6: Generate Prisma client
log('');
log('Step 6: Generating Prisma client...', 'yellow');
// Use node to run prisma directly to avoid permission issues
const prismaCliPath = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
if (fs.existsSync(prismaCliPath)) {
  if (exec(`node "${prismaCliPath}" generate`)) {
    log('  ✓ Prisma client generated', 'green');
  } else {
    // Fallback to npx
    log('  Trying with npx...', 'yellow');
    if (exec('npx --yes prisma generate')) {
      log('  ✓ Prisma client generated', 'green');
    } else {
      log('  ✗ Failed to generate Prisma client', 'red');
      log('  Try running: chmod +x node_modules/.bin/prisma', 'yellow');
      process.exit(1);
    }
  }
} else {
  // Use npx as fallback
  if (exec('npx --yes prisma generate')) {
    log('  ✓ Prisma client generated', 'green');
  } else {
    log('  ✗ Failed to generate Prisma client', 'red');
    log('  Try running: npm install', 'yellow');
    process.exit(1);
  }
}

// Step 7: Push schema to database
log('');
log('Step 7: Creating database and pushing schema...', 'yellow');
if (fs.existsSync(prismaCliPath)) {
  if (exec(`node "${prismaCliPath}" db push`)) {
    log('  ✓ Database created and schema pushed', 'green');
  } else {
    // Fallback to npx
    if (exec('npx --yes prisma db push')) {
      log('  ✓ Database created and schema pushed', 'green');
    } else {
      log('  ✗ Failed to push schema', 'red');
      process.exit(1);
    }
  }
} else {
  if (exec('npx --yes prisma db push')) {
    log('  ✓ Database created and schema pushed', 'green');
  } else {
    log('  ✗ Failed to push schema', 'red');
    process.exit(1);
  }
}

// Step 8: Seed database
log('');
log('Step 8: Seeding database...', 'yellow');
if (exec('npm run db:seed')) {
  log('  ✓ Database seeded', 'green');
} else {
  log('  ⚠️  Seeding failed (this is okay if seed script doesn\'t exist)', 'yellow');
}

log('');
log('========================================', 'cyan');
log('✅ SQLite Setup Complete!', 'green');
log('========================================', 'cyan');
log('');
log('Next steps:', 'yellow');
log('  npm run dev          - Start development server', 'blue');
log('  npm run db:studio    - Open Prisma Studio', 'blue');
log('');
log('To switch back to PostgreSQL:', 'yellow');
log('  npm run setup:postgres', 'blue');
log('');

