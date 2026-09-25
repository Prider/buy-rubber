import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { hashPassword } from '@/platform/auth';
import { logger } from '@/shared/logger';
import { hashResetToken } from '@/platform/passwordReset';

export const runtime = 'nodejs';

const INVALID_LINK = 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    if (!token) {
      return NextResponse.json({ success: false, message: INVALID_LINK }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 },
      );
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ success: false, message: INVALID_LINK }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'ตั้งรหัสผ่านใหม่แล้ว' });
  } catch (error) {
    logger.error('Reset password failed', error);
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถตั้งรหัสผ่านใหม่ได้' },
      { status: 500 },
    );
  }
}
