import { NextRequest, NextResponse } from 'next/server';
import { getAttendance } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const rows = await getAttendance();
  const header = ['user_id', 'name', 'email', 'location', 'scannedAt'];
  const csv = [header.join(',')];

  rows.forEach((r) => {
    // Use scannerLocation if available, fallback to location for backward compatibility
    const locationValue = r.scannerLocation || r.location || '';
    const fields = [
      r.userId,
      `"${r.user?.name || ''}"`,
      `"${r.user?.email || ''}"`,
      `"${locationValue}"`,
      r.scannedAt,
    ];
    csv.push(fields.join(','));
  });

  const body = csv.join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="attendance.csv"',
    },
  });
}
