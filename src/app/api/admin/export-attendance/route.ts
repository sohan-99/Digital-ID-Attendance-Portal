import { NextRequest, NextResponse } from 'next/server';
import { getAttendance } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const rows = getAttendance();
  const header = ['user_id', 'name', 'email', 'location', 'scannedAt'];
  const csv = [header.join(',')];

  rows.forEach((r) => {
    const fields = [
      r.userId,
      `"${r.user?.name || ''}"`,
      `"${r.user?.email || ''}"`,
      `"${r.location || ''}"`,
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
