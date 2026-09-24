import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth(request, { allowPending: true });
  if (!auth.ok) return auth.response;

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.auth.tenantId },
    select: { id: true, slug: true, name: true, email: true, plan: true, status: true },
  });

  return NextResponse.json({
    ...auth.auth,
    name: tenant?.name,
    email: tenant?.email ?? null,
  });
}
