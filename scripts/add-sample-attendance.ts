import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

// Read the current database
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(dbContent);

interface AttendanceRecord {
  id: number;
  userId: number;
  location: string;
  scannedAt: string;
}

// Generate sample attendance records for the last 7 days
const sampleAttendance: AttendanceRecord[] = [];
let attendanceId = db.nextAttendanceId;

// Get all user IDs (excluding admin)
const userIds = db.users.filter((u: { isAdmin: boolean }) => !u.isAdmin).map((u: { id: number }) => u.id);

if (userIds.length === 0) {
  console.log('No regular users found. Please create some users first.');
  process.exit(1);
}

// Generate attendance for the last 7 days
for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  
  // Random number of scans per day (2-5 scans per user)
  userIds.forEach((userId: number) => {
    const scansPerUser = Math.floor(Math.random() * 4) + 2; // 2-5 scans
    
    for (let i = 0; i < scansPerUser; i++) {
      const scanTime = new Date(date);
      scanTime.setHours(8 + Math.floor(Math.random() * 10)); // Random hour between 8 AM - 6 PM
      scanTime.setMinutes(Math.floor(Math.random() * 60));
      scanTime.setSeconds(Math.floor(Math.random() * 60));
      
      sampleAttendance.push({
        id: attendanceId++,
        userId: userId,
        location: ['Main Gate', 'Library', 'Classroom A', 'Lab B', 'Cafeteria'][Math.floor(Math.random() * 5)],
        scannedAt: scanTime.toISOString(),
      });
    }
  });
}

// Add sample attendance to database
db.attendance = [...db.attendance, ...sampleAttendance];
db.nextAttendanceId = attendanceId;

// Save the database
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Sample attendance data created successfully!');
console.log('');
console.log(`Generated ${sampleAttendance.length} attendance records for ${userIds.length} users over the last 7 days.`);
console.log('');
console.log('📊 Charts should now display data in the admin dashboard!');
console.log('Visit: http://localhost:3000/admin');
