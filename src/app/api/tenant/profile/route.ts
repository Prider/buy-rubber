import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { requireTenantAuth } from '@/platform/tenant';
import { isValidEmail, normalizeEmail } from '@/platform/email';
import { shopPaymentStatus } from '@/platform/tenantProfile';

export const runtime = 'nodejs';

async function tenantEmail(tenantId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ email: string | null }>>`
    SELECT "email" FROM "Tenant" WHERE "id" = ${tenantId} LIMIT 1
  `;
  return rows[0]?.email || null;
}

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth(request, { allowPending: true });
  if (!auth.ok) return auth.response;

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.auth.tenantId },
    select: { id: true, slug: true, name: true, plan: true, status: true },
  });

  if (!tenant) {
    return NextResponse.json({ success: false, message: 'ไม่พบร้าน' }, { status: 404 });
  }

  const payments = await prisma.paymentRequest.findMany({
    where: { tenantId: auth.auth.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      amount: true,
      status: true,
      rejectReason: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  const email = await tenantEmail(tenant.id);
  const paymentStatus = shopPaymentStatus({
    plan: tenant.plan,
    tenantStatus: tenant.status,
  });

  return NextResponse.json({
    success: true,
    shop: {
      slug: tenant.slug,
      name: tenant.name,
      email,
      plan: tenant.plan,
      tenantStatus: tenant.status,
    },
    paymentStatus,
    payments,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTenantAuth(request, { allowPending: true });
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const email = normalizeEmail(String(body.email || ''));
  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: 'กรุณากรอกอีเมลให้ถูกต้อง' }, { status: 400 });
  }

  await prisma.$executeRaw`UPDATE "Tenant" SET "email" = ${email} WHERE "id" = ${auth.auth.tenantId}`;
  return NextResponse.json({ success: true, email });
}
