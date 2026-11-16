import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { readServerLicenseStatus } from '@/lib/licenseServer';

export async function GET(_request: NextRequest) {
  try {
    logger.debug('GET /api/health - Health check');

    let license: { licensed: boolean; status: string; message: string; enforced: boolean } | null =
      null;
    try {
      const status = readServerLicenseStatus();
      license = {
        licensed: status.licensed,
        status: status.status,
        message: status.message,
        enforced: status.enforced,
      };
    } catch (licenseError) {
      logger.error('GET /api/health - License status failed', licenseError);
    }

    return NextResponse.json({
      status: 'ok',
      mode: 'server',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      license,
    });
  } catch (error) {
    logger.error('GET /api/health - Failed', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
