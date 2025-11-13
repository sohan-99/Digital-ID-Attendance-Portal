import { NextRequest, NextResponse } from 'next/server';
import { getAttendance, countUsers, countAttendance, recentCounts } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const rows = await getAttendance();
  
  if (!date) {
    return NextResponse.json({ rows });
  }

  const filtered = rows.filter((r) => r.scannedAt && r.scannedAt.slice(0, 10) === date);
  return NextResponse.json({ rows: filtered });
}
