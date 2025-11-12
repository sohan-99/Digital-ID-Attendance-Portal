import { NextRequest, NextResponse } from 'next/server';
import { addAttendance, findUserById, getAttendance } from '@/lib/db';
import { verifyToken, requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication for scanning
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Check if the authenticated user is an admin
    const scanningUser = findUserById(authResult.user.id);
    if (!scanningUser || !scanningUser.isAdmin) {
      return NextResponse.json({ error: 'Access denied. Only administrators can scan QR codes.' }, { status: 403 });
    }

    const body = await request.json();
    const { token, location } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Verify the QR code token
    let userId: number;
    try {
      const payload = verifyToken(token);
      // Support both userId and id fields for backward compatibility
      userId = (payload as { userId?: number; id?: number }).userId || payload.id;
      
      if (!userId) {
        return NextResponse.json({ error: 'Invalid token: missing user ID' }, { status: 400 });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const user = findUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Quick duplicate check (optimized - only last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAttendance = getAttendance({ userId });
    
    const recentScan = recentAttendance.find(att => {
      const scannedAt = new Date(att.scannedAt);
      return scannedAt > fiveMinutesAgo && att.location === location;
    });

    if (recentScan) {
      return NextResponse.json(
        { error: 'Already scanned recently at this location' },
        { status: 409 }
      );
    }

    // Record attendance
    const attendance = addAttendance({
      userId: user.id,
      location: location || null,
      scannedAt: new Date(),
    });

    // Return minimal response for speed
    return NextResponse.json({
      ok: true,
      attendanceId: attendance.id,
      user: { id: user.id, name: user.name, department: user.department },
      scannedAt: attendance.scannedAt,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const rows = getAttendance(userId ? { userId: parseInt(userId, 10) } : undefined);
  return NextResponse.json({ rows });
}
