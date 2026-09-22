import { NextRequest, NextResponse } from 'next/server';
import { generateToken, type TenantPlan } from '@/lib/auth';
import { validateSlug } from '@/lib/slug';
import { provisionTenant } from '@/lib/provisionTenant';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan: TenantPlan = body.plan === 'premium' ? 'premium' : 'freemium';
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const name = String(body.companyName || '').trim();
    const address = String(body.companyAddress || '').trim();
    const slugResult = validateSlug(String(body.slug || ''));

    if (!slugResult.ok) {
      return NextResponse.json({ success: false, message: slugResult.message }, { status: 400 });
    }
    if (!username || username.length < 2) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อร้านสำหรับสลิป' }, { status: 400 });
    }

    const existing = await prisma.tenant.findUnique({
      where: { slug: slugResult.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'รหัสร้านนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    const { tenant, user } = await provisionTenant({
      slug: slugResult.slug,
      name,
      address,
      plan,
      status: plan === 'premium' ? 'pending_payment' : 'active',
      adminUsername: username,
      adminPassword: password,
      adminRole: 'admin',
    });

    const token = generateToken({
      kind: 'shop',
      userId: user.id,
      username: user.username,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      plan: tenant.plan as TenantPlan,
      tenantStatus: tenant.status as 'active' | 'pending_payment' | 'rejected',
    });

    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        plan: tenant.plan,
        tenantStatus: tenant.status,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
      },
      next: plan === 'premium' ? '/signup/payment' : '/login',
    }, { status: 201 });
  } catch (error) {
    logger.error('Signup failed', error);
    return NextResponse.json({ success: false, message: 'ไม่สามารถสมัครใช้งานได้' }, { status: 500 });
  }
}
