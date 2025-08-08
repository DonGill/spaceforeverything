import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getUserByEmail, createSession, getSessionByToken, invalidateSession, updateUserLastLogin } from './database';

// ============================================
// PASSWORD UTILITIES
// ============================================

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// SESSION TOKEN UTILITIES
// ============================================

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export async function authenticateUser(email: string, password: string) {
  try {
    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.PasswordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check if user is active
    if (!user.IsActive) {
      return { success: false, error: 'Account is disabled' };
    }

    // Generate session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create session in database
    await createSession(user.Id, sessionToken, expiresAt);

    // Update last login
    await updateUserLastLogin(user.Id);

    return {
      success: true,
      user: {
        id: user.Id,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.RoleName,
        emailVerified: user.EmailVerified
      },
      sessionToken
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function validateSession(sessionToken: string) {
  try {
    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return { success: false, error: 'Invalid or expired session' };
    }

    return {
      success: true,
      user: {
        id: session.UserId,
        email: session.Email,
        firstName: session.FirstName,
        lastName: session.LastName,
        role: session.RoleName
      }
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { success: false, error: 'Session validation failed' };
  }
}

export async function logoutUser(sessionToken: string) {
  try {
    await invalidateSession(sessionToken);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}

// ============================================
// AUTHORIZATION UTILITIES
// ============================================

export function requireAdmin(userRole: string): boolean {
  return userRole === 'Admin';
}

export function requireListerOrAdmin(userRole: string): boolean {
  return ['Lister', 'Admin'].includes(userRole);
}

// ============================================
// MIDDLEWARE TYPES
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}