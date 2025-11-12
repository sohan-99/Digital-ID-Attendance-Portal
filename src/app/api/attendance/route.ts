import { NextRequest, NextResponse } from 'next/server';
import { getAttendance, findUserById } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface JWTPayload {
  userId: number;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // If userId is provided, verify it matches the authenticated user (or user is admin)
    let userId = authResult.user.id;
    
    if (userIdParam) {
      const requestedUserId = parseInt(userIdParam);
      
      // Check if requesting user is admin
      const user = findUserById(authResult.user.id);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Allow if admin or if requesting own records
      if (user.isAdmin || authResult.user.id === requestedUserId) {
        userId = requestedUserId;
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch attendance records for the user
    const attendance = getAttendance({ userId });

    return NextResponse.json({ rows: attendance }, { status: 200 });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
