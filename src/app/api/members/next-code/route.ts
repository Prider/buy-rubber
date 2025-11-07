import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lastMember = await prisma.member.findFirst({
      select: { code: true },
      where: {
        code: {
          startsWith: 'M',
        },
      },
      orderBy: {
        code: 'desc',
      },
    });

    let nextNumber = 1;

    if (lastMember?.code && /^M\d+$/.test(lastMember.code)) {
      const numericPart = parseInt(lastMember.code.substring(1), 10);
      if (!Number.isNaN(numericPart)) {
        nextNumber = numericPart + 1;
      }
    }

    const nextCode = `M${String(nextNumber).padStart(3, '0')}`;

    return NextResponse.json({ code: nextCode });
  } catch (error) {
    console.error('Failed to generate next member code:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างรหัสสมาชิกใหม่ได้' },
      { status: 500 }
    );
  }
}
