import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { CreateUserRequest, UpdateUserRequest } from '@/types/user';

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

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminRole(request)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const users = await userStore.getAllUsers();
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json({
      success: true,
      users: usersWithoutPasswords
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminRole(request)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const body: CreateUserRequest = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json({
        success: false,
        message: 'Username, password, and role are required'
      }, { status: 400 });
    }

    const user = await userStore.createUser(body);
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    
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
