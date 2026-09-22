import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { CreateUserRequest, isAdminLike } from '@/types/user';
import { logger } from '@/lib/logger';
import { isPremiumActive, requireTenantAuth } from '@/lib/tenant';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    logger.info('GET /api/users - Request received');
    if (!isAdminLike(auth.auth.role)) {
      logger.warn('GET /api/users - Unauthorized access attempt');
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    const users = await userStore.getAllUsers(auth.auth.tenantId);
    const usersWithoutPasswords = users.map(({ password: _password, ...user }) => user);

    logger.info('GET /api/users - Success', { count: users.length });

    return NextResponse.json({
      success: true,
      users: usersWithoutPasswords,
      plan: auth.auth.plan,
      canAddUsers: isPremiumActive(auth.auth),
    });
  } catch (error) {
    logger.error('GET /api/users - Failed', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantAuth(request);
    if (!auth.ok) return auth.response;
    logger.info('POST /api/users - Request received');
    if (!isAdminLike(auth.auth.role)) {
      logger.warn('POST /api/users - Unauthorized access attempt');
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    if (!isPremiumActive(auth.auth)) {
      return NextResponse.json({
        success: false,
        message: 'แพ็คเกจฟรีใช้ได้ 1 ผู้ใช้ หากต้องการเพิ่มพนักงาน กรุณาอัปเกรดเป็น Premium',
        code: 'SEAT_LIMIT',
      }, { status: 403 });
    }

    const body: CreateUserRequest = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      logger.warn('POST /api/users - Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Username, password, and role are required',
      }, { status: 400 });
    }

    logger.info('Creating user', { username, role });

    const user = await userStore.createUser(auth.auth.tenantId, body);
    logger.info('POST /api/users - Success', { userId: user.id, username: user.username });
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/users - Failed', error);

    if (error instanceof Error && error.message === 'Username already exists') {
      logger.warn('POST /api/users - Duplicate username');
      return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 409 });
    }

    if (
      error instanceof Error &&
      (error.message === 'Cannot create root user' || error.message === 'Invalid role')
    ) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
