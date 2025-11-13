import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const user = await findUserById(authResult.user.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
      studentId: user.studentId,
      program: user.program,
      department: user.department,
      batch: user.batch,
      session: user.session,
      bloodGroup: user.bloodGroup,
    },
  });
}
