import { NextRequest, NextResponse } from 'next/server';
import { allUsers, addUser, findUserByEmail } from '@/lib/db';
import { hashPassword, requireAdmin, validatePassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const users = allUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    studentId: u.studentId,
    program: u.program,
    department: u.department,
    batch: u.batch,
    session: u.session,
    bloodGroup: u.bloodGroup,
  }));

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

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

    return NextResponse.json({
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
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Could not create user' }, { status: 500 });
  }
}
