import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUser } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { profilePicture } = body;

    if (!profilePicture) {
      return NextResponse.json({ error: 'Missing profile picture data' }, { status: 400 });
    }

    if (!profilePicture.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format. Must be a data URL.' }, { status: 400 });
    }

    if (profilePicture.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Maximum 5MB.' }, { status: 400 });
    }

    const user = await updateUser(authResult.user.id, { profilePicture });
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
  } catch (error) {
    console.error('Profile picture update error:', error);
    return NextResponse.json({ error: 'Could not update profile picture' }, { status: 500 });
  }
}
