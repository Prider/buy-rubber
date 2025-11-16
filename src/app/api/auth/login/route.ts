import { NextRequest, NextResponse } from 'next/server';
import { LoginRequest, LoginResponse } from '@/types/user';
import { logger } from '@/lib/logger';
import { userStore } from '@/lib/userStore';

// Ensure Node.js runtime (required for Prisma and Buffer)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Log DATABASE_URL status for debugging
    logger.debug('Login API - DATABASE_URL', { 
      isSet: !!process.env.DATABASE_URL,
      masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/[^\/]+$/, '/***') : 'not set'
    });

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
    let allUsers;
    try {
      allUsers = await userStore.getAllUsers();
      logger.debug('Total users in store', { count: allUsers.length });
      logger.debug('Users list', { users: allUsers.map((u: any) => ({ username: u.username, role: u.role })) });
    } catch (dbError) {
      logger.error('Failed to get users from database', dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      logger.error('Database error details', dbError, { 
        errorMessage,
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set'
      });
      return NextResponse.json<LoginResponse>({
        success: false,
        message: `Database connection error: ${errorMessage}. Please check if the database file exists and DATABASE_URL is set correctly.`
      }, { status: 500 });
    }

    let user;
    try {
      user = await userStore.authenticateUser(username, password);
    } catch (authError) {
      logger.error('Failed to authenticate user', authError);
      const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
      return NextResponse.json<LoginResponse>({
        success: false,
        message: `Authentication error: ${errorMessage}`
      }, { status: 500 });
    }
    
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
    
    // Log more details about the error
    if (error instanceof Error) {
      logger.error('Error details', error, { 
        message: error.message, 
        stack: error.stack,
        name: error.name 
      });
    }
    
    // Return a proper JSON response even on error
    return NextResponse.json<LoginResponse>({
      success: false,
      message: error instanceof Error ? `Internal server error: ${error.message}` : 'Internal server error'
    }, { status: 500 });
  }
}