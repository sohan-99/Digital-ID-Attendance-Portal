import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { findUserById } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@pundra.edu';

export interface UserPayload {
  id: number;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export function generateUserToken(user: UserPayload, expiresIn: string = '6h'): string {
  const payload = { userId: user.id, id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin || false };
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function generateQRToken(userId: number, expiresIn: string = '3d'): string {
  // Generate a short token with only the user ID for QR codes
  const payload = { id: userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasLetter && hasNumber && hasSpecial;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function verifyToken(token: string): UserPayload {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
}

export interface AuthRequest extends NextRequest {
  user?: UserPayload & { isAdmin: boolean };
}

export function getAuthUser(request: NextRequest): (UserPayload & { isAdmin: boolean }) | null {
  const auth = request.headers.get('authorization');
  if (!auth) {
    console.log('[AUTH] No authorization header');
    return null;
  }
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('[AUTH] Invalid authorization format');
    return null;
  }
  
  const token = parts[1];
  try {
    const payload = verifyToken(token);
    // The isAdmin field is now included in the JWT token payload
    return { ...payload, isAdmin: payload.isAdmin || false };
  } catch (error) {
    console.log('[AUTH] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export function requireAuth(request: NextRequest): { user: UserPayload & { isAdmin: boolean } } | { error: string; status: number } {
  const user = getAuthUser(request);
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user };
}

export function requireAdmin(request: NextRequest): { user: UserPayload & { isAdmin: boolean } } | { error: string; status: number } {
  const authResult = requireAuth(request);
  if ('error' in authResult) return authResult;
  
  if (!authResult.user.isAdmin) {
    return { error: 'Forbidden', status: 403 };
  }
  
  return authResult;
}
