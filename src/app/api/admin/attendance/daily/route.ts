import { NextRequest, NextResponse } from 'next/server';
import { getAttendance } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface AttendanceRecord {
  id: number;
  userId: number;
  location: string | null;
  scannedAt: string;
}

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);

  const all = getAttendance();
  
  // Create array of dates for the last N days
  const labels: string[] = [];
  const dailyMap: Record<string, AttendanceRecord[]> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    dailyMap[key] = [];
  }

  // Group attendance records by day
  all.forEach((r) => {
    const day = r.scannedAt.slice(0, 10);
    if (dailyMap[day]) {
      dailyMap[day].push(r);
    }
  });

  // Calculate scan counts and unique user counts for each day
  const scanCounts: number[] = [];
  const uniqueUserCounts: number[] = [];

  labels.forEach((date) => {
    const records = dailyMap[date] || [];
    scanCounts.push(records.length);
    
    // Count unique users
    const uniqueUsers = new Set(records.map(r => r.userId));
    uniqueUserCounts.push(uniqueUsers.size);
  });

  return NextResponse.json({ 
    labels,
    scanCounts,
    uniqueUserCounts,
    daily: dailyMap 
  });
}
