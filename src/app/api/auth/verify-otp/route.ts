import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUser, init } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

// Initialize database
init().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Check if OTP expired
    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
    }

    // Generate QR token (unique token for QR code)
    const qrToken = randomBytes(32).toString('hex');

    // Update user: mark as verified, clear OTP, and set QR token
    const updatedUser = await updateUser(user.id, {
      emailVerified: true,
      otp: null,
      otpExpiry: null,
      qrToken,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      qrToken,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
