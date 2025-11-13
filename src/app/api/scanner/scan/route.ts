import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById, addAttendance } from '@/lib/db';

// IMPORTANT: Use the same JWT_SECRET as in /lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

interface ScannerTokenPayload {
  scannerAdminId: number;
  username: string;
  location: string;
  role: string;
  isSuperAdmin?: boolean;
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

export async function POST(req: NextRequest) {
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

    // Get QR code token and optional location from request body
    const body = await req.json();
    const { qrcodeToken, location: requestedLocation } = body;

    if (!qrcodeToken) {
      return NextResponse.json(
        { error: 'QR code token is required' },
        { status: 400 }
      );
    }

    // Determine the scanning location
    // Super admins can specify location, regular scanner admins use their assigned location
    const scanLocation = (scannerData.isSuperAdmin || scannerData.location === 'All') && requestedLocation
      ? requestedLocation
      : scannerData.location;

    // Verify QR code token and find user
    let userId: number;
    try {
      const qrDecoded = jwt.verify(qrcodeToken, JWT_SECRET) as { userId?: number; id?: number };
      // Support both userId and id fields for backward compatibility
      userId = qrDecoded.userId || qrDecoded.id || 0;
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid QR code: missing user ID' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 400 }
      );
    }

    // Find user (fast lookup)
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Quick duplicate check (optimized - only last 5 minutes)
    // Check both location and scannerLocation for compatibility
    const { getAttendance } = await import('@/lib/db');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentAttendance = await getAttendance({ userId });
    const recentScan = recentAttendance.find((att: any) => {
      const scannedAt = new Date(att.scannedAt);
      const attLocation = att.scannerLocation || att.location;
      return scannedAt > fiveMinutesAgo && attLocation === scanLocation;
    });

    if (recentScan) {
      return NextResponse.json(
        {
          error: 'Already scanned recently at this location',
          warning: true,
        },
        { status: 409 }
      );
    }

    // Record attendance (fast write) - save location in BOTH fields for cross-compatibility
    const attendance = await addAttendance({
      userId,
      location: scanLocation,
      scannedBy: scannerData.scannerAdminId,
      scannerLocation: scanLocation,
      scannedAt: new Date(),
    });

    // Return minimal success response for speed
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        department: user.department,
      },
      attendance: {
        id: attendance.id,
        scannedAt: attendance.scannedAt,
      },
      location: scanLocation,
    });
  } catch (error) {
    console.error('Scanner scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
