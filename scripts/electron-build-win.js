#!/usr/bin/env node

/**
 * Windows Electron build with an empty member list and no purchase records.
 *
 * First launch copies prisma/backups/initial-data.db (falling back to
 * prisma/dev.db). Both files are packaged, so both are cleared before
 * electron-builder runs. Local dev.db and the factory snapshot are restored
 * afterward, including when the build fails.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const devDbPath = path.join(projectRoot, 'prisma', 'dev.db');
const initialDbPath = path.join(projectRoot, 'prisma', 'backups', 'initial-data.db');
const DB_SUFFIXES = ['', '-wal', '-shm', '-journal'];

function run(command) {
  const result = spawnSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const error = new Error(`Command failed (${result.status}): ${command}`);
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

function copyIfExists(from, to) {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
  }
}

function backupDatabase(src, destBase) {
  for (const suffix of DB_SUFFIXES) {
    copyIfExists(src + suffix, destBase + suffix);
  }
}

function removeDatabaseFiles(dbPath) {
  for (const suffix of DB_SUFFIXES) {
    const filePath = dbPath + suffix;
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }
}

function restoreDatabase(backupBase, dest) {
  removeDatabaseFiles(dest);
  for (const suffix of DB_SUFFIXES) {
    copyIfExists(backupBase + suffix, dest + suffix);
  }
}

async function stripMembersAndPurchases(dbPath) {
  const { PrismaClient } = require('@prisma/client');
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`;
  const prisma = new PrismaClient();

  try {
    const purchases = await prisma.purchase.deleteMany({});
    const members = await prisma.member.deleteMany({});
    const remaining = {
      purchases: await prisma.purchase.count(),
      members: await prisma.member.count(),
    };

    console.log(
      `✓ Cleared packaged database ${path.relative(projectRoot, dbPath)}: ` +
        `${members.count} members, ${purchases.count} purchases`,
    );

    if (remaining.purchases !== 0 || remaining.members !== 0) {
      throw new Error(
        `Packaged database still has ${remaining.members} members and ${remaining.purchases} purchases`,
      );
    }
  } finally {
    await prisma.$disconnect();
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
  }
}

async function main() {
  const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yangdee-electron-win-'));
  const devBackup = path.join(backupDir, 'dev.db');
  const initialBackup = path.join(backupDir, 'initial-data.db');
  const syncedInitialBackup = path.join(backupDir, 'initial-data.synced.db');
  let prepareFinished = false;
  let exitCode = 0;

  backupDatabase(devDbPath, devBackup);
  backupDatabase(initialDbPath, initialBackup);

  try {
    console.log('📦 Preparing factory database...');
    run('node scripts/prepare-electron-build.js');
    prepareFinished = true;
    backupDatabase(initialDbPath, syncedInitialBackup);

    console.log('🛠  Building Next.js app...');
    run('npx cross-env NEXT_PRIVATE_SKIP_SWC_NATIVE_DOWNLOAD=1 next build');

    console.log('🧹 Removing members and purchase records from the Windows package...');
    await stripMembersAndPurchases(devDbPath);
    removeDatabaseFiles(initialDbPath);
    fs.copyFileSync(devDbPath, initialDbPath);
    console.log('✓ prisma/backups/initial-data.db matches the empty packaged database');

    console.log('📦 Packaging Windows installer...');
    run('npx electron-builder --win');
  } catch (error) {
    exitCode = error.exitCode || 1;
    console.error(error.message || error);
  } finally {
    try {
      restoreDatabase(devBackup, devDbPath);
      if (prepareFinished && fs.existsSync(syncedInitialBackup)) {
        restoreDatabase(syncedInitialBackup, initialDbPath);
      } else {
        restoreDatabase(initialBackup, initialDbPath);
      }
      console.log('✓ Restored local prisma/dev.db and factory initial-data.db');
    } catch (restoreError) {
      exitCode = exitCode || 1;
      console.error('Failed to restore local databases:', restoreError.message || restoreError);
      console.error(`Backups are in ${backupDir}`);
    }

    if (exitCode === 0) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
  }

  process.exit(exitCode);
}

main();
