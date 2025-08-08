import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/middleware';
import { promoteUserToLister, getUserById } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdminRole(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { userId } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', success: false },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      );
    }

    // Check if user is already a Lister or Admin
    if (targetUser.RoleName === 'Lister' || targetUser.RoleName === 'Admin') {
      return NextResponse.json(
        { error: `User is already a ${targetUser.RoleName}`, success: false },
        { status: 400 }
      );
    }

    // Promote user to Lister
    await promoteUserToLister(userId, authResult.user!.id);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.Email} promoted to Lister successfully`
    });

  } catch (error) {
    console.error('User promotion error:', error);
    return NextResponse.json(
      { error: 'Promotion failed', success: false },
      { status: 500 }
    );
  }
}