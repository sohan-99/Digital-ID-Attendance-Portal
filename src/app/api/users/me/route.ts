import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUser } from '@/lib/db';
import { requireAuth, SUPER_ADMIN_EMAIL } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const user = findUserById(authResult.user.id);
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

export async function PUT(request: NextRequest) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const user = findUserById(authResult.user.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Only super admin can edit their details
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Only super admin can edit profile details' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, studentId, program, department, batch, session, bloodGroup } = body;

    // Validate and update only allowed fields
    const updates: Partial<typeof user> = {};
    
    if (name !== undefined && typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }
    if (studentId !== undefined) updates.studentId = studentId;
    if (program !== undefined) updates.program = program;
    if (department !== undefined) updates.department = department;
    if (batch !== undefined) updates.batch = batch;
    if (session !== undefined) updates.session = session;
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup;

    const updatedUser = updateUser(user.id, updates);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        profilePicture: updatedUser.profilePicture,
        studentId: updatedUser.studentId,
        program: updatedUser.program,
        department: updatedUser.department,
        batch: updatedUser.batch,
        session: updatedUser.session,
        bloodGroup: updatedUser.bloodGroup,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
