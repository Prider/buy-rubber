import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { generateToken, verifyPassword } from '@/platform/auth';
import { logger } from '@/shared/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
    }

    const owner = await prisma.platformUser.findUnique({ where: { username } });
    if (!owner || !owner.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, owner.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
    }

    const token = generateToken({
      kind: 'platform',
      userId: owner.id,
      username: owner.username,
      role: 'platform',
    });

    return NextResponse.json({
      success: true,
      token,
      user: { id: owner.id, username: owner.username, role: 'platform' },
    });
  } catch (error) {
    logger.error('Platform login failed', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
