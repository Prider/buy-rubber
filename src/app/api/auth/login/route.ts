import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';
import { LoginRequest, LoginResponse } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    console.log('Login attempt:', { username, password: '***' });

    if (!username || !password) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: 'Username and password are required'
      }, { status: 400 });
    }

    // Debug: Check if users exist
    const allUsers = await userStore.getAllUsers();
    console.log('Total users in store:', allUsers.length);
    console.log('Users:', allUsers.map(u => ({ username: u.username, role: u.role })));

    const user = await userStore.authenticateUser(username, password);
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:', { id: user.id, username: user.username, role: user.role });
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

    console.log('Login successful, token generated');

    return NextResponse.json<LoginResponse>({
      success: true,
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<LoginResponse>({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}