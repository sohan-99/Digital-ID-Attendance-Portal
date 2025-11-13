import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findScannerAdminByUsername, logScannerLogin } from '@/lib/db';

// IMPORTANT: Use the same JWT_SECRET as in /lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const body = await req.json();
    const { username, password, location } = body;

    if (!username || !password || !location) {
      // Log failed attempt - missing credentials
      await logScannerLogin({
        username: username || 'unknown',
        location: location || 'unknown',
        success: false,
        errorMessage: 'Missing username, password, or location',
        ipAddress,
        userAgent,
      });
      
      return NextResponse.json(
        { error: 'Username, password, and location are required' },
        { status: 400 }
      );
    }

    // Find scanner admin by username
    const scannerAdmin = await findScannerAdminByUsername(username);
    
    if (!scannerAdmin) {
      // Log failed attempt - user not found
      await logScannerLogin({
        username,
        location,
        success: false,
        errorMessage: 'Invalid credentials - user not found',
        ipAddress,
        userAgent,
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = bcrypt.compareSync(password, scannerAdmin.passwordHash);
    
    if (!isValidPassword) {
      // Log failed attempt - wrong password
      await logScannerLogin({
        username,
        location,
        success: false,
        errorMessage: 'Invalid credentials - wrong password',
        ipAddress,
        userAgent,
        scannerAdminId: scannerAdmin.id,
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify location matches (skip for super admins)
    if (!scannerAdmin.isSuperAdmin && scannerAdmin.location !== location) {
      // Log failed attempt - wrong location
      await logScannerLogin({
        username,
        location,
        success: false,
        errorMessage: `Access denied - Invalid location (expected: ${scannerAdmin.location})`,
        ipAddress,
        userAgent,
        scannerAdminId: scannerAdmin.id,
      });
      
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

    // Log successful login
    await logScannerLogin({
      username,
      location,
      success: true,
      ipAddress,
      userAgent,
      scannerAdminId: scannerAdmin.id,
    });

    // Return token and scanner admin info (without password hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...scannerAdminData } = scannerAdmin;

    return NextResponse.json({
      token,
      scannerAdmin: scannerAdminData,
    });
  } catch (error) {
    console.error('Scanner admin login error:', error);
    
    // Log error
    try {
      await logScannerLogin({
        username: 'unknown',
        location: 'unknown',
        success: false,
        errorMessage: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress,
        userAgent,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
