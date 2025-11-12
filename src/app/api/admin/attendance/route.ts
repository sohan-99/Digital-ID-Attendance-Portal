import { NextRequest, NextResponse } from 'next/server';
import { getAttendance, countUsers, countAttendance, recentCounts, findUserById } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const scannerLocation = searchParams.get('scannerLocation') as 'campus' | 'library' | 'event' | null;

  // Get the current admin's scanner location
  const currentAdmin = findUserById(authResult.user.id);
  const adminScannerLocation = currentAdmin?.scannerLocation;

  // If admin has a scanner location, only show attendance from their scanner
  // Super admins (without scanner location) can see all
  let filter: { scannerLocation?: 'campus' | 'library' | 'event' | null } = {};
  if (adminScannerLocation) {
    filter.scannerLocation = adminScannerLocation;
  } else if (scannerLocation) {
    filter.scannerLocation = scannerLocation;
  }

  const rows = getAttendance(filter);
  
  if (!date) {
    return NextResponse.json({ rows });
  }

  const filtered = rows.filter((r) => r.scannedAt && r.scannedAt.slice(0, 10) === date);
  return NextResponse.json({ rows: filtered });
}
