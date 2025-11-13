import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, init } from '@/lib/db';
import { comparePassword, generateUserToken } from '@/lib/auth';

// Initialize database
init();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[LOGIN] Attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      console.log('[LOGIN] Missing fields');
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user) {
      console.log('[LOGIN] User not found:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    console.log('[LOGIN] User found:', { id: user.id, email: user.email, hasHash: !!user.passwordHash });

    const ok = comparePassword(password, user.passwordHash);
    console.log('[LOGIN] Password match:', ok);
    
    if (!ok) {
      console.log('[LOGIN] Password mismatch for:', email);
      return NextResponse.json({ 
        error: 'Invalid credentials', 
        hint: process.env.NODE_ENV === 'development' ? 'Check your password. Default: Admin@123' : undefined 
      }, { status: 400 });
    }

    console.log('[LOGIN] Login successful for:', email);
    const token = generateUserToken(user, '7d');

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    return NextResponse.json({ 
      error: 'Login failed',
      hint: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 400 });
  }
}
