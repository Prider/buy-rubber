import path from 'path';
import fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../prisma', () => ({
  prisma: {
    $disconnect: vi.fn(),
    backup: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
  },
  resetPrismaConnection: vi.fn(),
}));

vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { collectInitialDataCandidatePaths, resetToInitialData } from '../backup';

describe('collectInitialDataCandidatePaths', () => {
  it('includes both filename spellings next to the live database and in the project prisma folder', () => {
    const candidates = collectInitialDataCandidatePaths({
      dbPath: path.join('/data', 'prisma', 'dev.db'),
      cwd: '/app',
    });

    expect(candidates).toEqual([
      path.join('/data', 'prisma', 'backups', 'inital-data.db'),
      path.join('/data', 'prisma', 'backups', 'initial-data.db'),
      path.join('/app', 'prisma', 'backups', 'inital-data.db'),
      path.join('/app', 'prisma', 'backups', 'initial-data.db'),
    ]);
  });

  it('includes Electron resource and app bundle paths when provided', () => {
    const candidates = collectInitialDataCandidatePaths({
      dbPath: path.join('/userData', 'prisma', 'dev.db'),
      cwd: '/userData',
      resourcesPath: '/Resources',
      appPath: '/Resources/app',
    });

    expect(candidates).toContain(path.join('/Resources', 'prisma', 'backups', 'inital-data.db'));
    expect(candidates).toContain(path.join('/Resources', 'app', 'prisma', 'backups', 'inital-data.db'));
    expect(candidates).toContain(path.join('/Resources', 'app', 'prisma', 'backups', 'initial-data.db'));
  });
});

describe('resetToInitialData', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('rejects PostgreSQL databases', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

    const result = await resetToInitialData();

    expect(result.success).toBe(false);
    expect(result.error).toContain('SQLite');
  });

  it('returns an error when the initial snapshot is missing', async () => {
    process.env.DATABASE_URL = 'file:/tmp/prisma/dev.db';
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await resetToInitialData();

    expect(result.success).toBe(false);
    expect(result.error).toContain('ไม่พบไฟล์ข้อมูลเริ่มต้น');
    existsSpy.mockRestore();
  });
});
