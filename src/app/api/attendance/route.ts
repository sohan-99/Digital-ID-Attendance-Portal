import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getAttendance, findUserById } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

interface JWTPayload {
  userId?: number;
  id?: number;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[ATTENDANCE] No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    try {
      decoded = verify(token, JWT_SECRET) as JWTPayload;
      console.log('[ATTENDANCE] Token decoded:', decoded);
    } catch (error) {
      console.log('[ATTENDANCE] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // If userId is provided, verify it matches the authenticated user (or user is admin)
    // Support both userId and id fields in JWT payload
    let userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.log('[ATTENDANCE] No userId in token payload');
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    
    if (userIdParam) {
      const requestedUserId = parseInt(userIdParam);
      
      // Check if requesting user is admin
      const user = await findUserById(userId);
      
      if (!user) {
        console.log('[ATTENDANCE] User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Allow if admin or if requesting own records
      if (user.isAdmin || userId === requestedUserId) {
        userId = requestedUserId;
      } else {
        console.log('[ATTENDANCE] Forbidden: User', userId, 'tried to access user', requestedUserId);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    console.log('[ATTENDANCE] Fetching attendance for user:', userId);
    // Fetch attendance records for the user
    const attendance = await getAttendance({ userId });

    return NextResponse.json({ rows: attendance }, { status: 200 });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
