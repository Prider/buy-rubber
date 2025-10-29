import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { LoginRequest, LoginResponse } from '@/types/user';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    logger.info('Login attempt', { username, password: '***' });

    if (!username || !password) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Username and password are required'
      }, { status: 400 });
    }

    // Debug: Check if users exist
    const allUsers = await userStore.getAllUsers();
    logger.debug('Total users in store', { count: allUsers.length });
    logger.debug('Users list', { users: allUsers.map(u => ({ username: u.username, role: u.role })) });

    const user = await userStore.authenticateUser(username, password);
    
    logger.debug('Authentication result', { userFound: !!user });
    if (user) {
      logger.info('Login successful', { userId: user.id, username: user.username, role: user.role });
    }
    
    if (!user) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // In a real application, you would generate a JWT token here
    // For now, we'll use a simple session approach
    const token = Buffer.from(JSON.stringify({ userId: user.id, role: user.role })).toString('base64');

    logger.info('Token generated successfully', { userId: user.id });

    return NextResponse.json<LoginResponse>({
      success: true,
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    logger.error('Login failed', error);
    return NextResponse.json<LoginResponse>({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}