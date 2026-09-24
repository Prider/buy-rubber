import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSlug } from '@/lib/slug';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const slugParam = request.nextUrl.searchParams.get('slug') || '';
  const result = validateSlug(slugParam);
  if (!result.ok) {
    return NextResponse.json({ available: false, message: result.message }, { status: 400 });
  }

  const existing = await prisma.tenant.findUnique({
    where: { slug: result.slug },
    select: { id: true },
  });
  const pending = await prisma.pendingSignup.findFirst({
    where: { slug: result.slug, expiresAt: { gt: new Date() } },
    select: { id: true },
  });

  if (existing || pending) {
    return NextResponse.json({
      available: false,
      message: 'รหัสร้านนี้ถูกใช้แล้ว',
    });
  }

  return NextResponse.json({ available: true, slug: result.slug });
}
