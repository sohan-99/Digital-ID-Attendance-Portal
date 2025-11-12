import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById, addAttendance } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-scanner-secret-key-change-in-production';

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

    // Get QR code token from request body
    const body = await req.json();
    const { qrcodeToken } = body;

    if (!qrcodeToken) {
      return NextResponse.json(
        { error: 'QR code token is required' },
        { status: 400 }
      );
    }

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
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Quick duplicate check (optimized - only last 5 minutes)
    const { getAttendance } = await import('@/lib/db');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentAttendance = getAttendance({ userId });
    const recentScan = recentAttendance.find(att => {
      const scannedAt = new Date(att.scannedAt);
      return scannedAt > fiveMinutesAgo && att.scannerLocation === scannerData.location;
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

    // Record attendance (fast write)
    const attendance = addAttendance({
      userId,
      location: scannerData.location,
      scannedBy: scannerData.scannerAdminId,
      scannerLocation: scannerData.location,
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
      location: scannerData.location,
    });
  } catch (error) {
    console.error('Scanner scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
