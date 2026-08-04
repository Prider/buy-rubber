import type { LicenseValidateResponse } from '@/types/license';
import {
  offlineResultToValidateResponse,
  verifyOfflineLicenseFile,
} from '@/lib/licenseOffline';
import { EMBEDDED_LICENSE_PUBLIC_KEY } from '@/config/licensePublicKey';

const DEFAULT_LICENSE_API_URL = 'https://license-api.punsookinnotech.co';
const FETCH_TIMEOUT_MS = 25_000;

function normalizePem(value: string): string {
  let pem = value.trim();
  // Strip wrapping quotes left by broken multiline .env parsing
  if (
    (pem.startsWith('"') && pem.endsWith('"')) ||
    (pem.startsWith("'") && pem.endsWith("'"))
  ) {
    pem = pem.slice(1, -1).trim();
  }
  if (pem.startsWith('"') && !pem.includes('END PUBLIC KEY')) {
    pem = pem.slice(1).trim();
  }
  pem = pem.replace(/\\n/g, '\n').trim();
  return pem;
}

function isCompletePublicKey(pem: string): boolean {
  return (
    pem.includes('BEGIN PUBLIC KEY') &&
    pem.includes('END PUBLIC KEY') &&
    pem.length > 100
  );
}

export function getLicenseApiConfig() {
  const fromEnv = normalizePem(process.env.LICENSE_PUBLIC_KEY || '');
  const publicKey = isCompletePublicKey(fromEnv)
    ? fromEnv
    : normalizePem(EMBEDDED_LICENSE_PUBLIC_KEY);

  return {
    baseUrl: (process.env.LICENSE_API_URL || DEFAULT_LICENSE_API_URL).replace(/\/$/, ''),
    validationKey: process.env.LICENSE_VALIDATION_KEY || '',
    publicKey: isCompletePublicKey(publicKey) ? publicKey : '',
    skipCheck: process.env.SKIP_LICENSE_CHECK === 'true',
  };
}

/**
 * Download a signed offline .lkey from PunsookTechLicenseAPI.
 * GET /api/v1/validate/{licenseKey}/offline
 * Header: X-Validation-Key
 */
export async function fetchOfflineLicenseFile(
  licenseKey: string
): Promise<LicenseValidateResponse> {
  const { baseUrl, validationKey, publicKey, skipCheck } = getLicenseApiConfig();

  if (skipCheck) {
    return {
      valid: true,
      expired: false,
      renewalRequired: false,
      message: 'ข้ามการตรวจสอบใบอนุญาต (SKIP_LICENSE_CHECK)',
      expiresAt: null,
      renewalDate: null,
      licenseFile: null,
    };
  }

  if (!validationKey) {
    return {
      valid: false,
      expired: false,
      renewalRequired: false,
      message: 'ระบบยังไม่ได้ตั้งค่า LICENSE_VALIDATION_KEY',
      expiresAt: null,
      renewalDate: null,
      licenseFile: null,
    };
  }

  if (!publicKey) {
    return {
      valid: false,
      expired: false,
      renewalRequired: false,
      message: 'ระบบยังไม่ได้ตั้งค่า LICENSE_PUBLIC_KEY',
      expiresAt: null,
      renewalDate: null,
      licenseFile: null,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${baseUrl}/api/v1/validate/${encodeURIComponent(licenseKey)}/offline`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Validation-Key': validationKey,
        Accept: 'application/octet-stream, application/json, text/plain, */*',
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    const isLicenseFile = rawText.includes('BEGIN LICENSE KEY');

    // Error responses from LicenseAPI are JSON: { status, message, file: null }
    // Only treat as JSON when this is not a signed .lkey body.
    if (
      !isLicenseFile &&
      (contentType.includes('application/json') || rawText.trim().startsWith('{'))
    ) {
      let data: unknown = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }

      const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
      const status = typeof obj?.status === 'string' ? obj.status.toUpperCase() : '';
      const message =
        (typeof obj?.message === 'string' && obj.message) ||
        'ไม่สามารถดาวน์โหลดใบอนุญาตออฟไลน์ได้';

      if (status === 'EXPIRED') {
        return {
          valid: false,
          expired: true,
          renewalRequired: false,
          message: message || 'ใบอนุญาตหมดอายุ กรุณาติดต่อผู้ดูแลระบบ',
          expiresAt: null,
          renewalDate: null,
          licenseFile: null,
        };
      }

      return {
        valid: false,
        expired: false,
        renewalRequired: false,
        message,
        expiresAt: null,
        renewalDate: null,
        licenseFile: null,
      };
    }

    if (!response.ok || !isLicenseFile) {
      return {
        valid: false,
        expired: false,
        renewalRequired: false,
        message: !response.ok
          ? `เซิร์ฟเวอร์ใบอนุญาตตอบกลับ ${response.status}`
          : 'ไม่ได้รับไฟล์ใบอนุญาตออฟไลน์ที่ถูกต้อง',
        expiresAt: null,
        renewalDate: null,
        licenseFile: null,
      };
    }

    const verified = verifyOfflineLicenseFile(rawText, publicKey);
    return {
      ...offlineResultToValidateResponse(verified, rawText),
      // Keep the file even when renewal is required so the client can retry online
      licenseFile:
        verified.ok || verified.status === 'RENEWAL_REQUIRED' ? rawText : null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      valid: false,
      expired: false,
      renewalRequired: false,
      message: aborted
        ? 'การตรวจสอบใบอนุญาตหมดเวลา กรุณาลองใหม่'
        : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ใบอนุญาตได้',
      expiresAt: null,
      renewalDate: null,
      licenseFile: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verify a locally saved .lkey without contacting the remote API.
 */
export function checkOfflineLicenseFile(licenseFile: string): LicenseValidateResponse {
  const { publicKey, skipCheck } = getLicenseApiConfig();

  if (skipCheck) {
    return {
      valid: true,
      expired: false,
      renewalRequired: false,
      message: 'ข้ามการตรวจสอบใบอนุญาต (SKIP_LICENSE_CHECK)',
      expiresAt: null,
      renewalDate: null,
      licenseFile,
    };
  }

  if (!publicKey) {
    return {
      valid: false,
      expired: false,
      renewalRequired: false,
      message: 'ระบบยังไม่ได้ตั้งค่า LICENSE_PUBLIC_KEY',
      expiresAt: null,
      renewalDate: null,
      licenseFile: null,
    };
  }

  const verified = verifyOfflineLicenseFile(licenseFile, publicKey);
  return offlineResultToValidateResponse(verified, licenseFile);
}
