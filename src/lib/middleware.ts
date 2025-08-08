import { NextRequest, NextResponse } from 'next/server';
import { validateSession, requireAdmin, requireListerOrAdmin } from './auth';

export async function authenticateRequest(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  
  if (!sessionToken) {
    return { authenticated: false, user: null };
  }

  const sessionResult = await validateSession(sessionToken);
  
  return {
    authenticated: sessionResult.success,
    user: sessionResult.user || null
  };
}

export async function requireAuthentication(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: 'Authentication required', success: false },
      { status: 401 }
    );
  }
  
  return { user: authResult.user };
}

export async function requireAdminRole(request: NextRequest) {
  const authResult = await requireAuthentication(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the error response
  }
  
  if (!requireAdmin(authResult.user!.role)) {
    return NextResponse.json(
      { error: 'Admin access required', success: false },
      { status: 403 }
    );
  }
  
  return { user: authResult.user };
}

export async function requireListerRole(request: NextRequest) {
  const authResult = await requireAuthentication(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the error response
  }
  
  if (!requireListerOrAdmin(authResult.user!.role)) {
    return NextResponse.json(
      { error: 'Lister or Admin access required', success: false },
      { status: 403 }
    );
  }
  
  return { user: authResult.user };
}