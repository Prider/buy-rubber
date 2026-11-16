import { NextResponse } from 'next/server';
import { readServerLicenseStatus } from '@/lib/licenseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public license state for clients. Does not return the key or the .lkey file. */
export async function GET() {
  const status = readServerLicenseStatus();
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
