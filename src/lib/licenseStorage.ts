import type { LicenseState, LicenseStatus } from '@/types/license';

export const LICENSE_STORAGE_KEYS = {
  KEY: 'license_key',
  FILE: 'license_file',
  STATUS: 'license_status',
  EXPIRES_AT: 'license_expires_at',
  RENEWAL_DATE: 'license_renewal_date',
  LAST_CHECKED: 'license_last_checked',
  MESSAGE: 'license_message',
} as const;

const LICENSE_FILE_NAME = 'license.lkey';

export function maskLicenseKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '*'.repeat(trimmed.length);
  }
  return `${trimmed.slice(0, 4)}${'*'.repeat(Math.min(trimmed.length - 8, 12))}${trimmed.slice(-4)}`;
}

function emptyState(): LicenseState {
  return {
    status: 'unknown',
    licenseKey: null,
    licenseFile: null,
    expiresAt: null,
    renewalDate: null,
    lastCheckedAt: null,
    message: null,
  };
}

async function readLicenseFileFromElectron(): Promise<string | null> {
  try {
    const file = await window.electron?.readLicenseFile?.();
    return typeof file === 'string' && file.trim() ? file : null;
  } catch {
    return null;
  }
}

async function writeLicenseFileToElectron(contents: string): Promise<void> {
  try {
    await window.electron?.writeLicenseFile?.(contents);
  } catch {
    // Fall back to localStorage only
  }
}

async function clearLicenseFileFromElectron(): Promise<void> {
  try {
    await window.electron?.clearLicenseFile?.();
  } catch {
    // ignore
  }
}

export function readLicenseFromStorage(): LicenseState {
  if (typeof window === 'undefined') {
    return emptyState();
  }

  const licenseKey = localStorage.getItem(LICENSE_STORAGE_KEYS.KEY);
  const licenseFile = localStorage.getItem(LICENSE_STORAGE_KEYS.FILE);
  const status =
    (localStorage.getItem(LICENSE_STORAGE_KEYS.STATUS) as LicenseStatus | null) || 'missing';
  const expiresAt = localStorage.getItem(LICENSE_STORAGE_KEYS.EXPIRES_AT);
  const renewalDate = localStorage.getItem(LICENSE_STORAGE_KEYS.RENEWAL_DATE);
  const lastCheckedAt = localStorage.getItem(LICENSE_STORAGE_KEYS.LAST_CHECKED);
  const message = localStorage.getItem(LICENSE_STORAGE_KEYS.MESSAGE);

  return {
    status: licenseKey || licenseFile ? status : 'missing',
    licenseKey,
    licenseFile,
    expiresAt,
    renewalDate,
    lastCheckedAt,
    message,
  };
}

/**
 * Prefer Electron userData/license.lkey when available; otherwise localStorage.
 */
export async function readLicenseFile(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (window.electron?.isElectron) {
    const fromDisk = await readLicenseFileFromElectron();
    if (fromDisk) {
      // Keep localStorage in sync for metadata flows
      localStorage.setItem(LICENSE_STORAGE_KEYS.FILE, fromDisk);
      return fromDisk;
    }
  }

  return localStorage.getItem(LICENSE_STORAGE_KEYS.FILE);
}

export async function writeLicenseToStorage(
  state: Omit<LicenseState, 'licenseKey' | 'licenseFile'> & {
    licenseKey: string;
    licenseFile: string | null;
  }
): Promise<void> {
  localStorage.setItem(LICENSE_STORAGE_KEYS.KEY, state.licenseKey);
  localStorage.setItem(LICENSE_STORAGE_KEYS.STATUS, state.status);

  if (state.licenseFile) {
    localStorage.setItem(LICENSE_STORAGE_KEYS.FILE, state.licenseFile);
    if (window.electron?.isElectron) {
      await writeLicenseFileToElectron(state.licenseFile);
    }
  } else {
    localStorage.removeItem(LICENSE_STORAGE_KEYS.FILE);
  }

  if (state.expiresAt) {
    localStorage.setItem(LICENSE_STORAGE_KEYS.EXPIRES_AT, state.expiresAt);
  } else {
    localStorage.removeItem(LICENSE_STORAGE_KEYS.EXPIRES_AT);
  }

  if (state.renewalDate) {
    localStorage.setItem(LICENSE_STORAGE_KEYS.RENEWAL_DATE, state.renewalDate);
  } else {
    localStorage.removeItem(LICENSE_STORAGE_KEYS.RENEWAL_DATE);
  }

  if (state.lastCheckedAt) {
    localStorage.setItem(LICENSE_STORAGE_KEYS.LAST_CHECKED, state.lastCheckedAt);
  }

  if (state.message) {
    localStorage.setItem(LICENSE_STORAGE_KEYS.MESSAGE, state.message);
  } else {
    localStorage.removeItem(LICENSE_STORAGE_KEYS.MESSAGE);
  }
}

export async function clearLicenseStorage(): Promise<void> {
  Object.values(LICENSE_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  if (typeof window !== 'undefined' && window.electron?.isElectron) {
    await clearLicenseFileFromElectron();
  }
}

export { LICENSE_FILE_NAME };
