import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { requirePlatformAuth } from '@/platform/tenant';
import { shopPaymentStatus } from '@/platform/tenantProfile';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAuth(request);
  if (!auth.ok) return auth.response;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      plan: true,
      status: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });

  let emails = new Map<string, string | null>();
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; email: string | null }>>`
      SELECT "id", "email" FROM "Tenant"
    `;
    emails = new Map(rows.map((row) => [row.id, row.email]));
  } catch {
    emails = new Map();
  }

  return NextResponse.json({
    tenants: tenants.map((tenant) => {
      const payment = shopPaymentStatus({ plan: tenant.plan, tenantStatus: tenant.status });
      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        email: emails.get(tenant.id) || null,
        address: tenant.address,
        plan: tenant.plan,
        status: tenant.status,
        statusLabel: payment.label,
        statusTone: payment.tone,
        userCount: tenant._count.users,
        createdAt: tenant.createdAt,
      };
    }),
  });
}
