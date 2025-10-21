import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { UpdateUserRequest } from '@/types/user';

// Helper function to verify admin role
function verifyAdminRole(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

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
    
    const user = await userStore.updateUser(params.id, body);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    console.log('User updated successfully in Prisma:', { id: user.id, username: user.username });
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

    const success = await userStore.deleteUser(params.id);
    if (!success) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    console.log('User deleted successfully from Prisma:', params.id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
