import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUser, init } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateOTP, sendOTPEmail } from '@/lib/email';

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

    const user = await findUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Update user with new OTP
    const updatedUser = await updateUser(user.id, {
      otp,
      otpExpiry,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to generate new OTP' }, { status: 500 });
    }

    // Send OTP email
    try {
      const emailSent = await sendOTPEmail(user.email, otp, user.name);
      if (!emailSent) {
        console.log('⚠️  Email not configured. OTP generated but email not sent.');
        console.log('📧 User:', user.email);
        console.log('🔐 OTP (for testing):', otp);
        return NextResponse.json({ 
          error: 'Email service not configured. Check server console for OTP.',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only in dev mode
        }, { status: 500 });
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      console.log('🔐 OTP (for testing):', otp);
      return NextResponse.json({ 
        error: 'Failed to send OTP email. Check server console for OTP.',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only in dev mode
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'New OTP sent to your email',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}
