import { createVerify } from 'node:crypto';
import type {
  OfflineLicenseData,
  OfflineLicensePayload,
  OfflineVerifyResult,
} from '@/types/license';

const BEGIN_MARKER = '-----BEGIN LICENSE KEY-----';
const END_MARKER = '-----END LICENSE KEY-----';

/**
 * Extract and decode the base64 JSON payload from a .lkey file body.
 */
export function parseLicenseFile(fileContents: string): OfflineLicensePayload {
  const trimmed = fileContents.trim();
  const withoutMarkers = trimmed
    .replace(BEGIN_MARKER, '')
    .replace(END_MARKER, '')
    .replace(/[\n\r\s]/g, '');

  if (!withoutMarkers) {
    throw new Error('License file is empty');
  }

  let json: string;
  try {
    json = Buffer.from(withoutMarkers, 'base64').toString('utf8');
  } catch {
    throw new Error('License file is not valid base64');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('License file JSON is invalid');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('License file payload is invalid');
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.signature !== 'string' || !obj.signature) {
    throw new Error('License file is missing signature');
  }
  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('License file is missing data');
  }

  return {
    signature: obj.signature,
    data: obj.data as OfflineLicenseData,
  };
}

/**
 * Verify RSA-SHA256 hex signature over JSON.stringify(data), matching LicenseAPI.
 */
export function verifyLicenseSignature(
  publicKeyPem: string,
  signatureHex: string,
  data: OfflineLicenseData
): boolean {
  const pem = publicKeyPem.trim();
  if (!pem) return false;

  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(JSON.stringify(data));
    verifier.end();
    return verifier.verify(pem, signatureHex, 'hex');
  } catch {
    return false;
  }
}

function normalizeDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return value.trim();
    return new Date(parsed).toISOString();
  }
  return null;
}

/** Epoch / zero date means "never expires" (LicenseAPI convention). */
export function isNeverExpires(isoOrDate: string | null | undefined): boolean {
  if (!isoOrDate) return true;
  const ms = Date.parse(isoOrDate);
  if (Number.isNaN(ms)) return false;
  return ms === 0 || new Date(ms).getTime() === 0;
}

export function isDatePast(isoOrDate: string | null | undefined, now = Date.now()): boolean {
  if (!isoOrDate || isNeverExpires(isoOrDate)) return false;
  const ms = Date.parse(isoOrDate);
  if (Number.isNaN(ms)) return false;
  return ms < now;
}

/**
 * Parse + RSA-verify a .lkey and enforce status / renewal / expiration rules.
 */
export function verifyOfflineLicenseFile(
  fileContents: string | null | undefined,
  publicKeyPem: string,
  now = Date.now()
): OfflineVerifyResult {
  if (!fileContents?.trim()) {
    return { ok: false, status: 'MISSING', message: 'ไม่พบไฟล์ใบอนุญาตออฟไลน์' };
  }

  let payload: OfflineLicensePayload;
  try {
    payload = parseLicenseFile(fileContents);
  } catch (error) {
    return {
      ok: false,
      status: 'INVALID',
      message: error instanceof Error ? error.message : 'ไฟล์ใบอนุญาตไม่ถูกต้อง',
    };
  }

  if (!verifyLicenseSignature(publicKeyPem, payload.signature, payload.data)) {
    return {
      ok: false,
      status: 'INVALID_SIGNATURE',
      message: 'ลายเซ็นใบอนุญาตไม่ถูกต้อง',
    };
  }

  const data = payload.data;
  const expiresAt = normalizeDate(data.expirationDate);
  const renewalDate = normalizeDate(data.renewalDate);
  const status = String(data.status || '').toUpperCase();

  if (status !== 'VALID') {
    if (status === 'EXPIRED') {
      return {
        ok: false,
        status: 'EXPIRED',
        data,
        expiresAt,
        renewalDate,
        message: 'ใบอนุญาตหมดอายุ กรุณาติดต่อผู้ดูแลระบบ',
      };
    }
    return {
      ok: false,
      status: 'INVALID',
      data,
      expiresAt,
      renewalDate,
      message: 'ใบอนุญาตไม่ถูกต้อง',
    };
  }

  if (isDatePast(expiresAt, now)) {
    return {
      ok: false,
      status: 'EXPIRED',
      data,
      expiresAt,
      renewalDate,
      message: 'ใบอนุญาตหมดอายุ กรุณาติดต่อผู้ดูแลระบบ',
    };
  }

  if (isDatePast(renewalDate, now)) {
    return {
      ok: false,
      status: 'RENEWAL_REQUIRED',
      data,
      expiresAt,
      renewalDate,
      message: 'ต้องต่ออายุใบอนุญาตออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ต',
    };
  }

  return {
    ok: true,
    status: 'VALID',
    data,
    expiresAt,
    renewalDate,
    message: 'ใบอนุญาตถูกต้อง',
  };
}

export function offlineResultToValidateResponse(
  result: OfflineVerifyResult,
  licenseFile?: string | null
): {
  valid: boolean;
  expired: boolean;
  renewalRequired: boolean;
  message: string;
  expiresAt: string | null;
  renewalDate: string | null;
  licenseFile: string | null;
} {
  return {
    valid: result.ok,
    expired: result.status === 'EXPIRED',
    renewalRequired: result.status === 'RENEWAL_REQUIRED',
    message: result.message,
    expiresAt: result.expiresAt ?? null,
    renewalDate: result.renewalDate ?? null,
    licenseFile: licenseFile ?? null,
  };
}
