import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/userStore';

export async function GET(request: NextRequest) {
  try {
    // Get all users to verify they exist
    const users = await userStore.getAllUsers();
    
    // Test authentication
    const testAuth = await userStore.authenticateUser('admin', 'admin123');
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: users.map(u => ({ id: u.id, username: u.username, role: u.role, isActive: u.isActive })),
      adminAuthTest: testAuth ? 'SUCCESS' : 'FAILED',
      adminUser: testAuth ? { id: testAuth.id, username: testAuth.username, role: testAuth.role } : null
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
