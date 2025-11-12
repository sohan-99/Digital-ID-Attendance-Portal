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

    const payload = verifyToken(token);
    const user = findUserById(payload.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const attendance = addAttendance({
      userId: user.id,
      location: location || null,
      scannedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      attendanceId: attendance.id,
      user: { id: user.id, name: user.name },
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
