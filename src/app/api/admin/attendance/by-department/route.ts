import { NextRequest, NextResponse } from 'next/server';
import { allUsers, getAttendance } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const allUsersData = allUsers();
  const allAttendance = getAttendance();

  // Filter attendance by date if provided
  const filteredAttendance = date
    ? allAttendance.filter((r) => r.scannedAt && r.scannedAt.slice(0, 10) === date)
    : allAttendance;

  // Group users by department
  const departmentMap: Record<string, any> = {};
  
  allUsersData.forEach((user) => {
    const dept = user.department || 'Unknown';
    if (!departmentMap[dept]) {
      departmentMap[dept] = {
        department: dept,
        totalStudents: 0,
        attendanceRecords: [],
        students: [],
      };
    }
    departmentMap[dept].totalStudents++;
    departmentMap[dept].students.push({
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      program: user.program,
      batch: user.batch,
      session: user.session,
    });
  });

  // Add attendance records to departments
  filteredAttendance.forEach((record) => {
    const user = allUsersData.find((u) => u.id === record.userId);
    if (user) {
      const dept = user.department || 'Unknown';
      if (departmentMap[dept]) {
        departmentMap[dept].attendanceRecords.push({
          ...record,
          studentName: user.name,
          studentId: user.studentId,
          email: user.email,
        });
      }
    }
  });

  // Calculate attendance count per student
  Object.keys(departmentMap).forEach((dept) => {
    departmentMap[dept].students = departmentMap[dept].students.map((student: any) => {
      const attendanceCount = filteredAttendance.filter((r) => r.userId === student.id).length;
      return { ...student, attendanceCount };
    });
  });

  return NextResponse.json({ departments: departmentMap });
}
