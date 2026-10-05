import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { UpdateUserRequest } from '@/types/user';
import { verifyAdminRole } from '@/lib/sessionToken';
import { prisma } from '@/lib/prisma';
import { getActivityActor, recordActivity } from '@/lib/activityLog';
import { diffFields } from '@/lib/activityLogShared';

// GET /api/users/[id] - Get user by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!verifyAdminRole(request)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const user = await userStore.getUserById(params.id);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/users/[id] - Update user request:', params.id);
    
    if (!verifyAdminRole(request)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const body: UpdateUserRequest = await request.json();
    console.log('Updating user in Prisma:', { id: params.id, updates: body });

    const before = await userStore.getUserById(params.id);
    const user = await userStore.updateUser(params.id, body);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    console.log('User updated successfully in Prisma:', { id: user.id, username: user.username });

    const userChanges: Record<string, unknown> = diffFields(
      {
        username: before?.username ?? null,
        role: before?.role ?? null,
        isActive: before?.isActive ?? null,
      },
      {
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
      ['username', 'role', 'isActive'],
    ) ?? {};
    if (body.password) {
      userChanges.password = { from: '(ซ่อน)', to: '(เปลี่ยนแล้ว)' };
    }
    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'update',
      entityType: 'user',
      entityId: user.id,
      entityLabel: user.username,
      summary: `แก้ผู้ใช้งาน ${user.username}`,
      changes: userChanges,
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error instanceof Error && error.message === 'Username already exists') {
      return NextResponse.json({
        success: false,
        message: 'Username already exists'
      }, { status: 409 });
    }

    if (
      error instanceof Error &&
      (error.message === 'Cannot modify root user' ||
        error.message === 'Cannot assign root role' ||
        error.message === 'Invalid role')
    ) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE /api/users/[id] - Delete user request:', params.id);
    
    if (!verifyAdminRole(request)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const before = await userStore.getUserById(params.id);
    const result = await userStore.deleteUser(params.id);
    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    if (result === 'deactivated') {
      console.log('User deactivated (has linked records):', params.id);
      await recordActivity(prisma, {
        actor: getActivityActor(request),
        action: 'delete',
        entityType: 'user',
        entityId: params.id,
        entityLabel: before?.username || params.id,
        summary: `ปิดการใช้งานผู้ใช้ ${before?.username || params.id}`,
        changes: {
          username: before?.username ?? null,
          role: before?.role ?? null,
          soft: true,
        },
      });
      return NextResponse.json({
        success: true,
        action: 'deactivated',
        message:
          'ผู้ใช้งานมีประวัติการทำรายการ จึงปิดการใช้งานแทนการลบ (ไม่สามารถลบได้เพราะมีข้อมูลที่เกี่ยวข้อง)',
      });
    }

    console.log('User deleted successfully from Prisma:', params.id);
    await recordActivity(prisma, {
      actor: getActivityActor(request),
      action: 'delete',
      entityType: 'user',
      entityId: params.id,
      entityLabel: before?.username || params.id,
      summary: `ลบผู้ใช้งาน ${before?.username || params.id}`,
      changes: {
        username: before?.username ?? null,
        role: before?.role ?? null,
        soft: false,
      },
    });

    return NextResponse.json({
      success: true,
      action: 'deleted',
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof Error && error.message === 'Cannot delete root user') {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
