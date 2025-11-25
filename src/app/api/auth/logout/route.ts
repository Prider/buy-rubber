import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/auth/logout - User logged out');
    
    // In a real application, you would invalidate the JWT token here
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('POST /api/auth/logout - Failed', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
