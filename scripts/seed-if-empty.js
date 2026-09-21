#!/usr/bin/env node

/**
 * Seed the database only when it has no users.
 * Safe for Vercel builds — never wipes existing production data.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      console.log(`Database already has ${count} users — skipping seed`);
      return;
    }

    console.log('Empty database — running seed...');
    execSync('npx tsx prisma/seed.ts', {
      stdio: 'inherit',
      env: process.env,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.warn('Seed check failed:', error.message);
  process.exit(0);
});
