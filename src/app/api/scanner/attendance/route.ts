import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getTodayAttendanceByLocation, getAttendanceByLocation } from '@/lib/db';

// IMPORTANT: Use the same JWT_SECRET as in /lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

interface ScannerTokenPayload {
  scannerAdminId: number;
  username: string;
  location: string;
  role: string;
}

function verifyScannerToken(token: string): ScannerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ScannerTokenPayload;
    if (decoded.role !== 'scanner_admin') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get and verify token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const scannerData = verifyScannerToken(token);

    if (!scannerData) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get('date');
    const todayOnly = searchParams.get('today') === 'true';

    let attendance;
    
    if (todayOnly) {
      // Get today's attendance for this location
      attendance = await getTodayAttendanceByLocation(scannerData.location);
    } else if (dateFilter) {
      // Get attendance for specific date
      const allAttendance = await getAttendanceByLocation(scannerData.location);
      attendance = allAttendance.filter(att => att.scannedAt.startsWith(dateFilter));
    } else {
      // Get all attendance for this location
      attendance = await getAttendanceByLocation(scannerData.location);
    }

    // Remove sensitive user data
    const safeAttendance = attendance.map(att => {
      if (att.user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, qrToken, qrTokenExpiry, ...safeUser } = att.user;
        return { ...att, user: safeUser };
      }
      return att;
    });

    return NextResponse.json({
      records: safeAttendance,
      count: safeAttendance.length,
      location: scannerData.location,
      date: dateFilter || 'all',
    });
  } catch (error) {
    console.error('Scanner attendance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
