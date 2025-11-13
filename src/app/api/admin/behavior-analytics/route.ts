import { NextRequest, NextResponse } from 'next/server';
import { getAttendance, allUsers } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Behavior categories based on arrival time
enum BehaviorCategory {
  REGULAR = 'Regular',
  LESS_REGULAR = 'Less Regular',
  IRREGULAR = 'Irregular',
  UNINTERESTED = 'Uninterested',
}

interface BehaviorStats {
  userId: number;
  userName: string;
  studentId?: string;
  department?: string;
  totalScans: number;
  onTimeCount: number;
  slightlyLateCount: number;
  lateCount: number;
  veryLateOrAbsent: number;
  behaviorScore: number;
  category: BehaviorCategory;
  message: string;
}

// Class start time (configurable)
const CLASS_START_HOUR = 9; // 9:00 AM
const CLASS_START_MINUTE = 0;

function calculateBehavior(attendanceRecords: any[]): BehaviorCategory {
  if (attendanceRecords.length === 0) return BehaviorCategory.UNINTERESTED;

  let onTimeCount = 0;
  let slightlyLateCount = 0;
  let lateCount = 0;
  let veryLateCount = 0;

  attendanceRecords.forEach((record) => {
    const scanTime = new Date(record.scannedAt);
    const scanHour = scanTime.getHours();
    const scanMinute = scanTime.getMinutes();

    // Calculate minutes difference from class start time
    const classStartMinutes = CLASS_START_HOUR * 60 + CLASS_START_MINUTE;
    const scanMinutes = scanHour * 60 + scanMinute;
    const diffMinutes = scanMinutes - classStartMinutes;

    if (diffMinutes <= 15) {
      onTimeCount++;
    } else if (diffMinutes <= 30) {
      slightlyLateCount++;
    } else if (diffMinutes <= 60) {
      lateCount++;
    } else {
      veryLateCount++;
    }
  });

  const total = attendanceRecords.length;
  const onTimePercentage = (onTimeCount / total) * 100;
  const slightlyLatePercentage = (slightlyLateCount / total) * 100;
  const latePercentage = (lateCount / total) * 100;

  // Determine category based on percentages
  if (onTimePercentage >= 70) {
    return BehaviorCategory.REGULAR;
  } else if (onTimePercentage + slightlyLatePercentage >= 60) {
    return BehaviorCategory.LESS_REGULAR;
  } else if (latePercentage >= 40 || total < 5) {
    return BehaviorCategory.IRREGULAR;
  } else {
    return BehaviorCategory.UNINTERESTED;
  }
}

function calculateBehaviorScore(attendanceRecords: any[]): number {
  if (attendanceRecords.length === 0) return 0;

  let totalScore = 0;
  const maxScorePerDay = 100;

  attendanceRecords.forEach((record) => {
    const scanTime = new Date(record.scannedAt);
    const scanHour = scanTime.getHours();
    const scanMinute = scanTime.getMinutes();

    const classStartMinutes = CLASS_START_HOUR * 60 + CLASS_START_MINUTE;
    const scanMinutes = scanHour * 60 + scanMinute;
    const diffMinutes = scanMinutes - classStartMinutes;

    // Score based on arrival time
    if (diffMinutes <= 15) {
      totalScore += 100; // Perfect score
    } else if (diffMinutes <= 30) {
      totalScore += 75; // Good score
    } else if (diffMinutes <= 60) {
      totalScore += 50; // Average score
    } else {
      totalScore += 25; // Poor score
    }
  });

  return Math.round(totalScore / attendanceRecords.length);
}

function getBehaviorMessage(category: BehaviorCategory, score: number): string {
  switch (category) {
    case BehaviorCategory.REGULAR:
      return `🌟 Great! You always attend class on time. Keep it up! Your attendance score is ${score}/100.`;
    case BehaviorCategory.LESS_REGULAR:
      return `💪 You're doing well, but arriving a little earlier will make it even better! Current score: ${score}/100.`;
    case BehaviorCategory.IRREGULAR:
      return `😅 Hey, you're being late too often! Try to improve a bit! Your score: ${score}/100.`;
    case BehaviorCategory.UNINTERESTED:
      return `🚨 Your absence is concerning! Be regular, or your course performance may be affected. Score: ${score}/100.`;
  }
}

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    // Get all users and attendance
    const users = await allUsers();
    const allAttendance = await getAttendance();

    // Calculate behavior for each user
    const behaviorStats: BehaviorStats[] = [];
    const categoryCount = {
      [BehaviorCategory.REGULAR]: 0,
      [BehaviorCategory.LESS_REGULAR]: 0,
      [BehaviorCategory.IRREGULAR]: 0,
      [BehaviorCategory.UNINTERESTED]: 0,
    };

    users.forEach((user) => {
      if (user.isAdmin) return; // Skip admin users

      const userAttendance = allAttendance.filter((a) => a.userId === user.id);
      const category = calculateBehavior(userAttendance);
      const score = calculateBehaviorScore(userAttendance);

      categoryCount[category]++;

      // Calculate detailed counts
      let onTimeCount = 0;
      let slightlyLateCount = 0;
      let lateCount = 0;
      let veryLateCount = 0;

      userAttendance.forEach((record) => {
        const scanTime = new Date(record.scannedAt);
        const scanHour = scanTime.getHours();
        const scanMinute = scanTime.getMinutes();
        const classStartMinutes = CLASS_START_HOUR * 60 + CLASS_START_MINUTE;
        const scanMinutes = scanHour * 60 + scanMinute;
        const diffMinutes = scanMinutes - classStartMinutes;

        if (diffMinutes <= 15) onTimeCount++;
        else if (diffMinutes <= 30) slightlyLateCount++;
        else if (diffMinutes <= 60) lateCount++;
        else veryLateCount++;
      });

      behaviorStats.push({
        userId: user.id,
        userName: user.name,
        studentId: user.studentId || undefined,
        department: user.department || undefined,
        totalScans: userAttendance.length,
        onTimeCount,
        slightlyLateCount,
        lateCount,
        veryLateOrAbsent: veryLateCount,
        behaviorScore: score,
        category,
        message: getBehaviorMessage(category, score),
      });
    });

    // Sort by behavior score (descending)
    behaviorStats.sort((a, b) => b.behaviorScore - a.behaviorScore);

    return NextResponse.json({
      students: behaviorStats,
      summary: {
        total: behaviorStats.length,
        regular: categoryCount[BehaviorCategory.REGULAR],
        lessRegular: categoryCount[BehaviorCategory.LESS_REGULAR],
        irregular: categoryCount[BehaviorCategory.IRREGULAR],
        uninterested: categoryCount[BehaviorCategory.UNINTERESTED],
        regularPercentage: Math.round((categoryCount[BehaviorCategory.REGULAR] / behaviorStats.length) * 100) || 0,
        lessRegularPercentage: Math.round((categoryCount[BehaviorCategory.LESS_REGULAR] / behaviorStats.length) * 100) || 0,
        irregularPercentage: Math.round((categoryCount[BehaviorCategory.IRREGULAR] / behaviorStats.length) * 100) || 0,
        uninterestedPercentage: Math.round((categoryCount[BehaviorCategory.UNINTERESTED] / behaviorStats.length) * 100) || 0,
      },
    });
  } catch (error) {
    console.error('Behavior analytics error:', error);
    return NextResponse.json({ error: 'Failed to calculate behavior analytics' }, { status: 500 });
  }
}
