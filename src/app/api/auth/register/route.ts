import { NextRequest, NextResponse } from 'next/server';
import { addUser, findUserByEmail, init } from '@/lib/db';
import { generateUserToken, hashPassword, validatePassword } from '@/lib/auth';
import { generateOTP, sendOTPEmail } from '@/lib/email';

// Initialize database
init().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, isAdmin, studentId, program, department, batch, session, bloodGroup } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters and include 1 letter, 1 number and 1 special character' },
        { status: 400 }
      );
    }

    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: 'Email exists' }, { status: 400 });
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const passwordHash = hashPassword(password);
    const user = await addUser({
      name,
      email,
      passwordHash,
      isAdmin: !!isAdmin,
      studentId,
      program,
      department,
      batch,
      session,
      bloodGroup,
      emailVerified: false,
      otp,
      otpExpiry,
    });

    // Send OTP email (don't fail registration if email fails)
    try {
      const emailSent = await sendOTPEmail(email, otp, name);
      if (!emailSent) {
        console.log('⚠️  Email not configured. Registration completed but OTP email not sent.');
        console.log('📧 User:', email);
        console.log('🔐 OTP (for testing):', otp);
        console.log('💡 User can use this OTP to verify their email.');
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      console.log('🔐 OTP (for testing):', otp);
      // Continue with registration even if email fails
    }

    const token = generateUserToken(user, '7d');

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        studentId: user.studentId,
        program: user.program,
        department: user.department,
        batch: user.batch,
        session: user.session,
        bloodGroup: user.bloodGroup,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Could not create user' }, { status: 400 });
  }
}
