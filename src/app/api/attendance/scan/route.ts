import { NextRequest, NextResponse } from 'next/server';
import { addAttendance, findUserById, getAttendance } from '@/lib/db';
import { verifyToken, requireAuth, requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Verify that the person scanning is an admin
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { token, location } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Verify the student's QR code token
    const payload = verifyToken(token);
    const user = findUserById(payload.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get scanner admin info
    const scannerAdmin = findUserById(authResult.user.id);
    const scannerLocation = scannerAdmin?.scannerLocation || null;

    const attendance = addAttendance({
      userId: user.id,
      location: location || null,
      scannedAt: new Date(),
      scannedBy: authResult.user.id,
      scannerLocation: scannerLocation,
    });

    return NextResponse.json({
      ok: true,
      attendanceId: attendance.id,
      user: { id: user.id, name: user.name },
      scannedAt: attendance.scannedAt,
      scannerLocation: scannerLocation,
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
