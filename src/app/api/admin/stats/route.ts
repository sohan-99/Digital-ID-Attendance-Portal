import { NextRequest, NextResponse } from 'next/server';
import { countUsers, countAttendance, recentCounts } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const totalUsers = await countUsers();
  const totalAttendance = await countAttendance();
  const recent = await recentCounts(7);

  return NextResponse.json({
    totalUsers,
    totalAttendance,
    recent,
  });
}
