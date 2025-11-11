import * as db from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Initializing database...');
  db.init();

  const pwd = bcrypt.hashSync('Admin@123', 10);

  console.log('Creating admin user...');
  const admin = db.addUser({
    name: 'Admin User',
    email: 'admin@pundra.edu',
    passwordHash: pwd,
    isAdmin: true,
    studentId: 'ADMIN001',
    program: 'Administration',
    department: 'Admin',
    batch: '2024',
    session: '2024-2025',
    bloodGroup: 'O+',
  });

  console.log('Creating sample students...');
  const pwd2 = bcrypt.hashSync('Student@123', 10);
  
  const alice = db.addUser({
    name: 'Alice Student',
    email: 'alice@pundra.edu',
    passwordHash: pwd2,
    studentId: 'STU2024001',
    program: 'BSc',
    department: 'Computer Science',
    batch: '2024',
    session: '2024-2025',
    bloodGroup: 'A+',
  });

  const bob = db.addUser({
    name: 'Bob Student',
    email: 'bob@pundra.edu',
    passwordHash: pwd2,
    studentId: 'STU2024002',
    program: 'BSc',
    department: 'Computer Science',
    batch: '2024',
    session: '2024-2025',
    bloodGroup: 'B+',
  });

  const charlie = db.addUser({
    name: 'Charlie Student',
    email: 'charlie@pundra.edu',
    passwordHash: pwd2,
    studentId: 'STU2024003',
    program: 'BSc',
    department: 'Mathematics',
    batch: '2024',
    session: '2024-2025',
    bloodGroup: 'AB+',
  });

  console.log('Creating sample attendance records...');
  db.addAttendance({
    userId: alice.id,
    location: 'Lecture Hall A',
    scannedAt: new Date(),
  });

  db.addAttendance({
    userId: bob.id,
    location: 'Library Entrance',
    scannedAt: new Date(),
  });

  db.addAttendance({
    userId: charlie.id,
    location: 'Lab Building',
    scannedAt: new Date(),
  });

  console.log('✅ Seed complete!');
  console.log('Admin login: admin@pundra.edu / Admin@123');
  console.log('Student login: alice@pundra.edu / Student@123');
  console.log('Student login: bob@pundra.edu / Student@123');
  console.log('Student login: charlie@pundra.edu / Student@123');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
