import { NextRequest, NextResponse } from 'next/server';
import { LoginRequest, LoginResponse } from '@/types/user';
import { logger } from '@/lib/logger';
import { userStore } from '@/lib/userStore';
import { generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeSlug } from '@/lib/slug';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const slug = normalizeSlug(body.slug || '');
    const { username, password } = body;

    logger.info('Login attempt', { slug, username, password: '***' });

    if (!slug || !username || !password) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'รหัสร้าน ชื่อผู้ใช้ และรหัสผ่านจำเป็นต้องกรอก',
      }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Invalid username or password',
      }, { status: 401 });
    }

    const user = await userStore.authenticateUser(tenant.id, username, password);

    if (!user) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Invalid username or password',
      }, { status: 401 });
    }

    const { password: _password, ...userWithoutPassword } = user;

    const token = generateToken({
      kind: 'shop',
      userId: user.id,
      username: user.username,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      plan: tenant.plan as 'freemium' | 'premium',
      tenantStatus: tenant.status as 'active' | 'pending_payment' | 'rejected',
    });

    return NextResponse.json<LoginResponse>({
      success: true,
      user: {
        ...userWithoutPassword,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        plan: tenant.plan as 'freemium' | 'premium',
        tenantStatus: tenant.status as 'active' | 'pending_payment' | 'rejected',
      },
      token,
    });
  } catch (error) {
    logger.error('Login failed', error);
    return NextResponse.json<LoginResponse>({
      success: false,
      message: error instanceof Error ? `Internal server error: ${error.message}` : 'Internal server error',
    }, { status: 500 });
  }
}
