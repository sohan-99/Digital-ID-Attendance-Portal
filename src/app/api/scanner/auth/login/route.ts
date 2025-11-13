import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findScannerAdminByUsername } from '@/lib/db';

// IMPORTANT: Use the same JWT_SECRET as in /lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, location } = body;

    if (!username || !password || !location) {
      return NextResponse.json(
        { error: 'Username, password, and location are required' },
        { status: 400 }
      );
    }

    // Find scanner admin by username
    const scannerAdmin = findScannerAdminByUsername(username);
    
    if (!scannerAdmin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = bcrypt.compareSync(password, scannerAdmin.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify location matches (skip for super admins)
    if (!scannerAdmin.isSuperAdmin && scannerAdmin.location !== location) {
      return NextResponse.json(
        { error: 'Access denied: Invalid location for this account' },
        { status: 403 }
      );
    }

    // Generate JWT token with scanner admin info
    const token = jwt.sign(
      {
        scannerAdminId: scannerAdmin.id,
        username: scannerAdmin.username,
        location: scannerAdmin.location,
        role: 'scanner_admin',
        isSuperAdmin: scannerAdmin.isSuperAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return token and scanner admin info (without password hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...scannerAdminData } = scannerAdmin;

    return NextResponse.json({
      token,
      scannerAdmin: scannerAdminData,
    });
  } catch (error) {
    console.error('Scanner admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
