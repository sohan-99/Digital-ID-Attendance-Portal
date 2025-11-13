import { NextRequest, NextResponse } from 'next/server';
import { getAttendance } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// Behavior categories
enum BehaviorCategory {
  REGULAR = 'Regular',
  LESS_REGULAR = 'Less Regular',
  IRREGULAR = 'Irregular',
  UNINTERESTED = 'Uninterested',
}

const CLASS_START_HOUR = 9;
const CLASS_START_MINUTE = 0;

function calculateUserBehavior(attendanceRecords: any[]) {
  if (attendanceRecords.length === 0) {
    return {
      category: BehaviorCategory.UNINTERESTED,
      score: 0,
      totalScans: 0,
      onTimeCount: 0,
      slightlyLateCount: 0,
      lateCount: 0,
      veryLateCount: 0,
      message: '🚨 You have not attended any classes yet. Please start attending regularly!',
    };
  }

  let onTimeCount = 0;
  let slightlyLateCount = 0;
  let lateCount = 0;
  let veryLateCount = 0;
  let totalScore = 0;

  attendanceRecords.forEach((record) => {
    const scanTime = new Date(record.scannedAt);
    const scanHour = scanTime.getHours();
    const scanMinute = scanTime.getMinutes();

    const classStartMinutes = CLASS_START_HOUR * 60 + CLASS_START_MINUTE;
    const scanMinutes = scanHour * 60 + scanMinute;
    const diffMinutes = scanMinutes - classStartMinutes;

    if (diffMinutes <= 15) {
      onTimeCount++;
      totalScore += 100;
    } else if (diffMinutes <= 30) {
      slightlyLateCount++;
      totalScore += 75;
    } else if (diffMinutes <= 60) {
      lateCount++;
      totalScore += 50;
    } else {
      veryLateCount++;
      totalScore += 25;
    }
  });

  const total = attendanceRecords.length;
  const score = Math.round(totalScore / total);
  const onTimePercentage = (onTimeCount / total) * 100;
  const slightlyLatePercentage = (slightlyLateCount / total) * 100;
  const latePercentage = (lateCount / total) * 100;

  let category: BehaviorCategory;
  let message: string;

  if (onTimePercentage >= 70) {
    category = BehaviorCategory.REGULAR;
    message = `🌟 Great! You always attend class on time. Keep it up! Your attendance score is ${score}/100.`;
  } else if (onTimePercentage + slightlyLatePercentage >= 60) {
    category = BehaviorCategory.LESS_REGULAR;
    message = `💪 You're doing well, but arriving a little earlier will make it even better! Current score: ${score}/100.`;
  } else if (latePercentage >= 40 || total < 5) {
    category = BehaviorCategory.IRREGULAR;
    message = `😅 Hey, you're being late too often! Try to improve a bit! Your score: ${score}/100.`;
  } else {
    category = BehaviorCategory.UNINTERESTED;
    message = `🚨 Your absence is concerning! Be regular, or your course performance may be affected. Score: ${score}/100.`;
  }

  return {
    category,
    score,
    totalScans: total,
    onTimeCount,
    slightlyLateCount,
    lateCount,
    veryLateCount,
    message,
    breakdown: {
      onTimePercentage: Math.round(onTimePercentage),
      slightlyLatePercentage: Math.round(slightlyLatePercentage),
      latePercentage: Math.round(latePercentage),
      veryLatePercentage: Math.round((veryLateCount / total) * 100),
    },
  };
}

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const userId = authResult.user.id;

    // Get user's attendance records
    const userAttendance = await getAttendance({ userId });

    // Calculate behavior
    const behavior = calculateUserBehavior(userAttendance);

    return NextResponse.json({
      behavior,
      recentScans: userAttendance.slice(-10).map((a) => ({
        date: a.scannedAt,
        location: a.scannerLocation || a.location,
      })),
    });
  } catch (error) {
    console.error('User behavior error:', error);
    return NextResponse.json({ error: 'Failed to calculate behavior' }, { status: 500 });
  }
}
