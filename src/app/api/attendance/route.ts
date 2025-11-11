import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getAttendance, findUserById } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: number;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;
    try {
      decoded = verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // If userId is provided, verify it matches the authenticated user (or user is admin)
    let userId = decoded.userId;
    
    if (userIdParam) {
      const requestedUserId = parseInt(userIdParam);
      
      // Check if requesting user is admin
      const user = findUserById(decoded.userId);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Allow if admin or if requesting own records
      if (user.isAdmin || decoded.userId === requestedUserId) {
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
