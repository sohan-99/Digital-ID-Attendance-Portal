import { NextRequest, NextResponse } from 'next/server';
import { addUser, findUserByEmail, init } from '@/lib/db';
import { generateUserToken, hashPassword, validatePassword } from '@/lib/auth';

// Initialize database
init();

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

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: 'Email exists' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const user = addUser({
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
    });

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
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Could not create user' }, { status: 400 });
  }
}
