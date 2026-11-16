import { NextResponse } from 'next/server';
import { readServerLicenseStatus } from '@/lib/licenseServer';
import { SERVER_LICENSE_REQUIRED } from '@/types/license';

/**
 * Block data APIs on the Electron server when its license file is missing or expired.
 * Client installs (app-mode.json role "client") and web deployments are not blocked here.
 */
export function rejectIfUnlicensed(): NextResponse | null {
  if (process.env.LICENSE_SERVER_ENFORCE !== '1') return null;
  if (process.env.SKIP_LICENSE_CHECK === 'true') return null;

  const status = readServerLicenseStatus();
  if (status.role === 'client' || status.licensed) return null;

  return NextResponse.json(
    {
      code: SERVER_LICENSE_REQUIRED,
      message: status.message,
      error: status.message,
    },
    { status: 403 }
  );
}
