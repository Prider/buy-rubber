import fs from 'fs';
import os from 'os';
import path from 'path';
import { checkOfflineLicenseFile, getLicenseApiConfig } from '@/lib/licenseApi';
import { messageForRemoteLicense } from '@/lib/licenseMessages';
import type { LicenseStatus, ServerLicenseStatus } from '@/types/license';

const LICENSE_FILE_NAME = 'license.lkey';
const APP_MODE_FILE_NAME = 'app-mode.json';
const USER_DATA_DIR_NAME = 'pos.punsook.innotech';
const VERIFY_CACHE_MS = 15_000;

let verifyCache: { key: string; at: number; value: ServerLicenseStatus } | null = null;

export function invalidateLicenseStatusCache(): void {
  verifyCache = null;
}

export function isLoopbackAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const ip = address.trim().replace(/^::ffff:/i, '');
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
}

/**
 * Production Electron overwrites this header from the socket address.
 * When the header is absent (next dev), activation stays available.
 */
export function isLocalLicenseActivation(request: {
  headers: { get(name: string): string | null };
}): boolean {
  if (process.env.LICENSE_SERVER_ENFORCE !== '1') return true;
  const header = request.headers.get('x-electron-remote-address');
  if (!header) return true;
  return isLoopbackAddress(header);
}

function defaultElectronUserData(): string {
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(base, USER_DATA_DIR_NAME);
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', USER_DATA_DIR_NAME);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), USER_DATA_DIR_NAME);
}

function userDataDirFromDatabaseUrl(dbUrl: string): string | null {
  if (!dbUrl.startsWith('file:')) return null;
  let filePath = dbUrl.slice('file:'.length);
  if (filePath.startsWith('//')) {
    filePath = filePath.replace(/^\/+/, '/');
  }
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }
  const folder = path.dirname(filePath);
  if (path.basename(folder).toLowerCase() === 'prisma') {
    return path.dirname(folder);
  }
  return folder;
}

export function licenseDataDirs(): string[] {
  const override = process.env.LICENSE_USER_DATA_DIR?.trim();
  if (override) return [override];

  const dirs: string[] = [];
  if (process.env.LICENSE_SERVER_ENFORCE === '1') {
    dirs.push(defaultElectronUserData());
  }
  const fromDb = userDataDirFromDatabaseUrl(process.env.DATABASE_URL || '');
  if (fromDb) dirs.push(fromDb);
  return [...new Set(dirs)];
}

function toStatus(valid: boolean, expired: boolean, renewalRequired: boolean): LicenseStatus {
  if (expired) return 'expired';
  if (renewalRequired) return 'renewal_required';
  if (valid) return 'valid';
  return 'invalid';
}

export function readInstalledAppRole(): 'server' | 'client' {
  for (const dir of licenseDataDirs()) {
    try {
      const raw = fs.readFileSync(path.join(dir, APP_MODE_FILE_NAME), 'utf8');
      const parsed = JSON.parse(raw) as { mode?: string };
      if (parsed?.mode === 'client') return 'client';
      if (parsed?.mode === 'server') return 'server';
    } catch {
      // try the next directory
    }
  }
  return 'server';
}

function readLicenseFileFromDisk(): string | null {
  for (const dir of licenseDataDirs()) {
    try {
      const filePath = path.join(dir, LICENSE_FILE_NAME);
      if (!fs.existsSync(filePath)) continue;
      const text = fs.readFileSync(filePath, 'utf8');
      if (text.includes('BEGIN LICENSE KEY')) return text;
    } catch {
      // try the next directory
    }
  }
  return null;
}

export function persistLicenseFile(contents: string): void {
  if (!contents.includes('BEGIN LICENSE KEY')) return;
  const dirs = licenseDataDirs();
  if (dirs.length === 0) return;

  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, LICENSE_FILE_NAME), contents, 'utf8');
    } catch (error) {
      console.error('Failed to persist license file', dir, error);
    }
  }
  invalidateLicenseStatusCache();
}

function computeServerLicenseStatus(): ServerLicenseStatus {
  const enforced = process.env.LICENSE_SERVER_ENFORCE === '1';
  const role = readInstalledAppRole();
  const { skipCheck } = getLicenseApiConfig();

  if (skipCheck) {
    return {
      enforced,
      licensed: true,
      role,
      status: 'valid',
      message: 'ข้ามการตรวจสอบใบอนุญาต (SKIP_LICENSE_CHECK)',
      expiresAt: null,
      renewalDate: null,
    };
  }

  const licenseFile = readLicenseFileFromDisk();
  if (!licenseFile) {
    return {
      enforced,
      licensed: false,
      role,
      status: 'missing',
      message: messageForRemoteLicense('missing'),
      expiresAt: null,
      renewalDate: null,
    };
  }

  try {
    const checked = checkOfflineLicenseFile(licenseFile);
    const status = toStatus(checked.valid, checked.expired, Boolean(checked.renewalRequired));
    return {
      enforced,
      licensed: checked.valid,
      role,
      status,
      message: checked.valid ? checked.message : messageForRemoteLicense(status),
      expiresAt: checked.expiresAt,
      renewalDate: checked.renewalDate ?? null,
    };
  } catch {
    return {
      enforced,
      licensed: false,
      role,
      status: 'error',
      message: messageForRemoteLicense('error'),
      expiresAt: null,
      renewalDate: null,
    };
  }
}

export function readServerLicenseStatus(): ServerLicenseStatus {
  const cacheKey = [
    process.env.LICENSE_SERVER_ENFORCE || '',
    process.env.LICENSE_USER_DATA_DIR || '',
    process.env.SKIP_LICENSE_CHECK || '',
    process.env.DATABASE_URL || '',
  ].join('|');
  const now = Date.now();
  if (verifyCache && verifyCache.key === cacheKey && now - verifyCache.at < VERIFY_CACHE_MS) {
    return { ...verifyCache.value, role: readInstalledAppRole() };
  }
  const value = computeServerLicenseStatus();
  verifyCache = { key: cacheKey, at: now, value };
  return value;
}
