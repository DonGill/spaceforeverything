import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, password } = body;

    // Validation
    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'All fields are required', success: false },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', success: false },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long', success: false },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists', success: false },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (defaults to 'User' role)
    const newUser = await createUser(email, firstName, lastName, hashedPassword);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      userId: newUser.Id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', success: false },
      { status: 500 }
    );
  }
}