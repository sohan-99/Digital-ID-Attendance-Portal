import { NextRequest, NextResponse } from 'next/server';
import { findUserById, findUserByEmail, updateUser, deleteUser } from '@/lib/db';
import { hashPassword, requireAdmin, validatePassword, SUPER_ADMIN_EMAIL } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  try {
    const body = await request.json();
    const { name, email, password, isAdmin, studentId, program, department, batch, session, bloodGroup } = body;

    const existing = findUserById(id);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect super admin from being edited by other admins
    if (existing.email === SUPER_ADMIN_EMAIL && authResult.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden: cannot modify the super admin' }, { status: 403 });
    }

    if (email && email !== existing.email) {
      const dup = findUserByEmail(email);
      if (dup) {
        return NextResponse.json({ error: 'Email exists' }, { status: 400 });
      }
    }

    if (password && !validatePassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters and include 1 letter, 1 number and 1 special character' },
        { status: 400 }
      );
    }

    const passwordHash = password ? hashPassword(password) : undefined;
    const updated = updateUser(id, {
      name,
      email,
      passwordHash,
      isAdmin,
      studentId,
      program,
      department,
      batch,
      session,
      bloodGroup,
    });

    return NextResponse.json({
      user: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
        isAdmin: updated!.isAdmin,
        studentId: updated!.studentId,
        program: updated!.program,
        department: updated!.department,
        batch: updated!.batch,
        session: updated!.session,
        bloodGroup: updated!.bloodGroup,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Could not update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  try {
    const target = findUserById(id);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (target.email === SUPER_ADMIN_EMAIL && authResult.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden: cannot delete the super admin' }, { status: 403 });
    }

    if (id === authResult.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const ok = deleteUser(id);
    if (!ok) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Could not delete user' }, { status: 500 });
  }
}
