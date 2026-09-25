import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/platform/userStore';
import { UpdateUserRequest, isAdminLike } from '@/platform/types/user';
import { requireTenantAuth } from '@/platform/tenant';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const auth = await requireTenantAuth(request);
  if (!auth.ok) return auth;
  if (!isAdminLike(auth.auth.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 }),
    };
  }
  return auth;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const user = await userStore.getUserById(params.id);
    if (!user || user.tenantId !== auth.auth.tenantId) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const { password: _password, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const existing = await userStore.getUserById(params.id);
    if (!existing || existing.tenantId !== auth.auth.tenantId) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const body: UpdateUserRequest = await request.json();
    const user = await userStore.updateUser(params.id, body);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const { password: _password, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    if (error instanceof Error && error.message === 'Username already exists') {
      return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 409 });
    }
    if (
      error instanceof Error &&
      (error.message === 'Cannot modify root user' ||
        error.message === 'Cannot assign root role' ||
        error.message === 'Invalid role')
    ) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const existing = await userStore.getUserById(params.id);
    if (!existing || existing.tenantId !== auth.auth.tenantId) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const result = await userStore.deleteUser(params.id);
    if (!result) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (result === 'deactivated') {
      return NextResponse.json({
        success: true,
        action: 'deactivated',
        message:
          'ผู้ใช้งานมีประวัติการทำรายการ จึงปิดการใช้งานแทนการลบ (ไม่สามารถลบได้เพราะมีข้อมูลที่เกี่ยวข้อง)',
      });
    }

    return NextResponse.json({
      success: true,
      action: 'deleted',
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cannot delete root user') {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
