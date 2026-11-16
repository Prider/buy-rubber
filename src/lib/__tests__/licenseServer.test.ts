import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { messageForRemoteLicense } from '@/lib/licenseMessages';
import { rejectIfUnlicensed } from '@/lib/licenseGuard';
import {
  invalidateLicenseStatusCache,
  isLocalLicenseActivation,
  isLoopbackAddress,
  persistLicenseFile,
  readInstalledAppRole,
  readServerLicenseStatus,
} from '@/lib/licenseServer';

const envKeys = [
  'LICENSE_SERVER_ENFORCE',
  'LICENSE_USER_DATA_DIR',
  'SKIP_LICENSE_CHECK',
  'DATABASE_URL',
] as const;

function restoreEnv(previous: Record<string, string | undefined>) {
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
  invalidateLicenseStatusCache();
}

describe('server license status', () => {
  const previous: Record<string, string | undefined> = {};
  let dir = '';

  beforeEach(() => {
    for (const key of envKeys) previous[key] = process.env[key];
  });

  afterEach(() => {
    restoreEnv(previous);
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    dir = '';
  });

  function useTempServer() {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'license-server-'));
    process.env.LICENSE_USER_DATA_DIR = dir;
    process.env.LICENSE_SERVER_ENFORCE = '1';
    delete process.env.SKIP_LICENSE_CHECK;
    invalidateLicenseStatusCache();
  }

  it('treats loopback addresses as the server machine', () => {
    expect(isLoopbackAddress('127.0.0.1')).toBe(true);
    expect(isLoopbackAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isLoopbackAddress('::1')).toBe(true);
    expect(isLoopbackAddress('192.168.1.20')).toBe(false);
  });

  it('allows activation when the desktop server did not tag the socket', () => {
    process.env.LICENSE_SERVER_ENFORCE = '1';
    expect(isLocalLicenseActivation({ headers: { get: () => null } })).toBe(true);
    expect(
      isLocalLicenseActivation({
        headers: { get: () => '192.168.1.20' },
      })
    ).toBe(false);
    expect(
      isLocalLicenseActivation({
        headers: { get: () => '::ffff:127.0.0.1' },
      })
    ).toBe(true);
  });

  it('reports a missing server license and blocks data APIs', async () => {
    useTempServer();
    const status = readServerLicenseStatus();
    expect(status.enforced).toBe(true);
    expect(status.licensed).toBe(false);
    expect(status.status).toBe('missing');
    expect(status.message).toBe(messageForRemoteLicense('missing'));

    const denied = rejectIfUnlicensed();
    expect(denied?.status).toBe(403);
    const body = await denied?.json();
    expect(body.code).toBe('SERVER_LICENSE_REQUIRED');
    expect(body.message).toContain('เซิร์ฟเวอร์');
  });

  it('does not block a machine installed as a client', async () => {
    useTempServer();
    fs.writeFileSync(path.join(dir, 'app-mode.json'), JSON.stringify({ mode: 'client' }));
    expect(readInstalledAppRole()).toBe('client');
    expect(rejectIfUnlicensed()).toBeNull();
  });

  it('accepts a license file saved on the server', () => {
    useTempServer();
    process.env.SKIP_LICENSE_CHECK = 'true';
    invalidateLicenseStatusCache();
    persistLicenseFile('-----BEGIN LICENSE KEY-----\nabc\n-----END LICENSE KEY-----');
    expect(fs.existsSync(path.join(dir, 'license.lkey'))).toBe(true);
    expect(readServerLicenseStatus().licensed).toBe(true);
  });

  it('describes an expired server license for clients', () => {
    expect(messageForRemoteLicense('expired')).toContain('เซิร์ฟเวอร์ต้องต่ออายุใบอนุญาต');
    expect(messageForRemoteLicense('renewal_required')).toContain('เซิร์ฟเวอร์ต้องต่ออายุใบอนุญาต');
    expect(messageForRemoteLicense('error')).toContain('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
  });
});
