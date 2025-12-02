/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const networkInfo: any = {};

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          networkInfo[name] = {
            address: iface.address,
            port: 3000,
            url: `http://${iface.address}:3000`
          };
        }
      }
    }

    return NextResponse.json({
      mode: 'server',
      port: 3000,
      host: 'localhost',
      allowExternalConnections: true,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      network: {
        localhost: 'http://localhost:3000',
        network: networkInfo
      }
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to get server info' },
      { status: 500 }
    );
  }
}
