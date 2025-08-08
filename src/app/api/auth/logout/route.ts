import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session')?.value;

    if (sessionToken) {
      // Invalidate session in database
      await logoutUser(sessionToken);
    }

    // Create response and clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('session');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed', success: false },
      { status: 500 }
    );
  }
}