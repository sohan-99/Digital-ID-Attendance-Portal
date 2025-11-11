import { NextRequest, NextResponse } from 'next/server';
import { getAttendance } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);

  const all = getAttendance();
  const map: Record<string, any[]> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = [];
  }

  all.forEach((r) => {
    const day = r.scannedAt.slice(0, 10);
    if (!map[day]) map[day] = [];
    map[day].push(r);
  });

  return NextResponse.json({ daily: map });
}
