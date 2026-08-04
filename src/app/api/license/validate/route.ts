import { NextRequest, NextResponse } from 'next/server';
import { checkOfflineLicenseFile, fetchOfflineLicenseFile } from '@/lib/licenseApi';
import { maskLicenseKey } from '@/lib/licenseStorage';
import type { LicenseValidateResponse } from '@/types/license';

export const runtime = 'nodejs';

/**
 * Activate / renew: fetch signed offline .lkey from LicenseAPI.
 * Body: { licenseKey }
 *
 * Offline check of a saved file:
 * Body: { licenseFile } (optional licenseKey ignored for verify-only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const licenseKey =
      typeof body?.licenseKey === 'string'
        ? body.licenseKey.trim()
        : typeof body?.key === 'string'
          ? body.key.trim()
          : '';
    const licenseFile =
      typeof body?.licenseFile === 'string' ? body.licenseFile : null;
    const mode = body?.mode === 'offline' ? 'offline' : 'activate';

    if (mode === 'offline' || (!licenseKey && licenseFile)) {
      if (!licenseFile?.trim()) {
        return NextResponse.json<LicenseValidateResponse>(
          {
            valid: false,
            expired: false,
            renewalRequired: false,
            message: 'ไม่พบไฟล์ใบอนุญาตออฟไลน์',
            expiresAt: null,
            renewalDate: null,
            licenseFile: null,
          },
          { status: 400 }
        );
      }

      const result = checkOfflineLicenseFile(licenseFile);
      return NextResponse.json<LicenseValidateResponse>({
        ...result,
        licenseKeyMasked: licenseKey ? maskLicenseKey(licenseKey) : undefined,
      });
    }

    if (!licenseKey) {
      return NextResponse.json<LicenseValidateResponse>(
        {
          valid: false,
          expired: false,
          renewalRequired: false,
          message: 'กรุณากรอก License Key',
          expiresAt: null,
          renewalDate: null,
          licenseFile: null,
        },
        { status: 400 }
      );
    }

    const result = await fetchOfflineLicenseFile(licenseKey);

    return NextResponse.json<LicenseValidateResponse>({
      ...result,
      licenseKeyMasked: maskLicenseKey(licenseKey),
    });
  } catch (error) {
    console.error('License validate error:', error);
    return NextResponse.json<LicenseValidateResponse>(
      {
        valid: false,
        expired: false,
        renewalRequired: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบใบอนุญาต',
        expiresAt: null,
        renewalDate: null,
        licenseFile: null,
      },
      { status: 500 }
    );
  }
}
