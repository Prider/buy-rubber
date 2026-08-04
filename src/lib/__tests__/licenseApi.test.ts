import { describe, expect, it } from 'vitest';
import { generateKeyPairSync, createSign } from 'node:crypto';
import {
  checkOfflineLicenseFile,
  fetchOfflineLicenseFile,
  getLicenseApiConfig,
} from '@/lib/licenseApi';
import {
  isDatePast,
  isNeverExpires,
  parseLicenseFile,
  verifyLicenseSignature,
  verifyOfflineLicenseFile,
} from '@/lib/licenseOffline';
import { maskLicenseKey } from '@/lib/licenseStorage';

function makeSignedLicenseFile(
  privateKey: string,
  data: Record<string, unknown>
): string {
  const signer = createSign('RSA-SHA256');
  signer.update(JSON.stringify(data));
  const signature = signer.sign(privateKey, 'hex');
  const content = Buffer.from(JSON.stringify({ signature, data })).toString('base64');
  const wrapped = content.replace(/(.{64})/g, '$1\n');
  return `-----BEGIN LICENSE KEY-----\n${wrapped}\n-----END LICENSE KEY-----`;
}

describe('licenseOffline', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();

  it('parses BEGIN/END LICENSE KEY base64 payload', () => {
    const file = makeSignedLicenseFile(privateKey, {
      status: 'VALID',
      key: 'TEST-KEY',
      renewalDate: future,
      expirationDate: future,
    });
    const payload = parseLicenseFile(file);
    expect(payload.signature).toMatch(/^[0-9a-f]+$/i);
    expect(payload.data.status).toBe('VALID');
    expect(payload.data.key).toBe('TEST-KEY');
  });

  it('verifies RSA-SHA256 signature over JSON.stringify(data)', () => {
    const data = {
      status: 'VALID',
      key: 'TEST-KEY',
      renewalDate: future,
      expirationDate: future,
    };
    const file = makeSignedLicenseFile(privateKey, data);
    const payload = parseLicenseFile(file);
    expect(verifyLicenseSignature(publicKey, payload.signature, payload.data)).toBe(true);
    expect(verifyLicenseSignature(publicKey, '00', payload.data)).toBe(false);
  });

  it('unlocks when status VALID and dates are in the future', () => {
    const file = makeSignedLicenseFile(privateKey, {
      status: 'VALID',
      key: 'TEST-KEY',
      groups: [],
      permissions: [],
      meta: {},
      maxUses: -1,
      currentUses: 0,
      renewalDate: future,
      expirationDate: new Date(0).toISOString(),
    });

    const result = verifyOfflineLicenseFile(file, publicKey);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('VALID');
      expect(isNeverExpires(result.expiresAt)).toBe(true);
    }
  });

  it('requires renewal when renewalDate is past', () => {
    const file = makeSignedLicenseFile(privateKey, {
      status: 'VALID',
      key: 'TEST-KEY',
      renewalDate: past,
      expirationDate: future,
    });

    const result = verifyOfflineLicenseFile(file, publicKey);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('RENEWAL_REQUIRED');
  });

  it('marks expired when expirationDate is past (non-zero)', () => {
    const file = makeSignedLicenseFile(privateKey, {
      status: 'VALID',
      key: 'TEST-KEY',
      renewalDate: future,
      expirationDate: past,
    });

    const result = verifyOfflineLicenseFile(file, publicKey);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('EXPIRED');
  });

  it('rejects tampered data', () => {
    const file = makeSignedLicenseFile(privateKey, {
      status: 'VALID',
      key: 'TEST-KEY',
      renewalDate: future,
      expirationDate: future,
    });
    const payload = parseLicenseFile(file);
    payload.data.key = 'TAMPERED-KEY';
    const tamperedBody = Buffer.from(JSON.stringify(payload)).toString('base64');
    const tampered = `-----BEGIN LICENSE KEY-----\n${tamperedBody}\n-----END LICENSE KEY-----`;
    const result = verifyOfflineLicenseFile(tampered, publicKey);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('INVALID_SIGNATURE');
  });
});

describe('license helpers', () => {
  it('masks license keys', () => {
    expect(maskLicenseKey('ABCD-1234-EFGH-5678')).toMatch(/^ABCD\*+5678$/);
  });

  it('detects past dates and never-expires epoch', () => {
    expect(isNeverExpires(new Date(0).toISOString())).toBe(true);
    expect(isDatePast(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(isDatePast(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it('checkOfflineLicenseFile respects SKIP_LICENSE_CHECK', () => {
    const prev = process.env.SKIP_LICENSE_CHECK;
    process.env.SKIP_LICENSE_CHECK = 'true';
    try {
      const result = checkOfflineLicenseFile('not-a-real-file');
      expect(result.valid).toBe(true);
      expect(result.message).toMatch(/SKIP_LICENSE_CHECK/);
    } finally {
      if (prev === undefined) delete process.env.SKIP_LICENSE_CHECK;
      else process.env.SKIP_LICENSE_CHECK = prev;
    }
  });

  it('getLicenseApiConfig reads validation key and a complete public key', () => {
    const prevV = process.env.LICENSE_VALIDATION_KEY;
    const prevP = process.env.LICENSE_PUBLIC_KEY;
    process.env.LICENSE_VALIDATION_KEY = 'vk';
    delete process.env.LICENSE_PUBLIC_KEY;
    process.env.SKIP_LICENSE_CHECK = 'false';
    try {
      const cfg = getLicenseApiConfig();
      expect(cfg.validationKey).toBe('vk');
      expect(cfg.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(cfg.publicKey).toContain('END PUBLIC KEY');
    } finally {
      if (prevV === undefined) delete process.env.LICENSE_VALIDATION_KEY;
      else process.env.LICENSE_VALIDATION_KEY = prevV;
      if (prevP === undefined) delete process.env.LICENSE_PUBLIC_KEY;
      else process.env.LICENSE_PUBLIC_KEY = prevP;
    }
  });
});

describe('fetchOfflineLicenseFile config errors', () => {
  it('reports missing validation key', async () => {
    const prevSkip = process.env.SKIP_LICENSE_CHECK;
    const prevKey = process.env.LICENSE_VALIDATION_KEY;
    const prevPub = process.env.LICENSE_PUBLIC_KEY;
    process.env.SKIP_LICENSE_CHECK = 'false';
    delete process.env.LICENSE_VALIDATION_KEY;
    process.env.LICENSE_PUBLIC_KEY = 'pk';
    try {
      const result = await fetchOfflineLicenseFile('ANY');
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/LICENSE_VALIDATION_KEY/);
    } finally {
      if (prevSkip === undefined) delete process.env.SKIP_LICENSE_CHECK;
      else process.env.SKIP_LICENSE_CHECK = prevSkip;
      if (prevKey === undefined) delete process.env.LICENSE_VALIDATION_KEY;
      else process.env.LICENSE_VALIDATION_KEY = prevKey;
      if (prevPub === undefined) delete process.env.LICENSE_PUBLIC_KEY;
      else process.env.LICENSE_PUBLIC_KEY = prevPub;
    }
  });
});
