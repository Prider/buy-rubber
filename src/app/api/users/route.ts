import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { CreateUserRequest, UpdateUserRequest } from '@/types/user';
import { logger } from '@/lib/logger';

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
    logger.info('GET /api/users - Request received');
    
    if (!verifyAdminRole(request)) {
      logger.warn('GET /api/users - Unauthorized access attempt');
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const users = await userStore.getAllUsers();
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    logger.info('GET /api/users - Success', { count: users.length });
    return NextResponse.json({
      success: true,
      users: usersWithoutPasswords
    });

  } catch (error) {
    logger.error('GET /api/users - Failed', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/users - Request received');
    
    if (!verifyAdminRole(request)) {
      logger.warn('POST /api/users - Unauthorized access attempt');
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const body: CreateUserRequest = await request.json();
    const { username, password, role } = body;

    logger.info('Creating user', { username, role });

    if (!username || !password || !role) {
      logger.warn('POST /api/users - Missing required fields');
      return NextResponse.json({
        success: false,
        message: 'Username, password, and role are required'
      }, { status: 400 });
    }

    const user = await userStore.createUser(body);
    logger.info('POST /api/users - Success', { userId: user.id, username: user.username });
    
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    logger.error('POST /api/users - Failed', error);
    
    if (error instanceof Error && error.message === 'Username already exists') {
      logger.warn('POST /api/users - Duplicate username');
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
