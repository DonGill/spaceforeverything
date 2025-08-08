import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated', success: false },
        { status: 401 }
      );
    }

    // Validate session
    const sessionResult = await validateSession(sessionToken);

    if (!sessionResult.success) {
      return NextResponse.json(
        { error: sessionResult.error, success: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: sessionResult.user
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Session validation failed', success: false },
      { status: 500 }
    );
  }
}