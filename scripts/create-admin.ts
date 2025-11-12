import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

// Read the current database
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(dbContent);

// Admin credentials
const adminPassword = 'Admin@123';
const adminEmail = 'admin@pundra.edu';

// Check if admin already exists
const existingAdmin = db.users.find((u: { email: string }) => u.email === adminEmail);

if (existingAdmin) {
  console.log('Admin user already exists!');
  console.log('Email:', adminEmail);
  console.log('Password: Admin@123');
  process.exit(0);
}

// Create admin user
const adminUser = {
  id: db.nextUserId,
  name: 'Super Admin',
  email: adminEmail,
  passwordHash: bcrypt.hashSync(adminPassword, 10),
  isAdmin: true,
  profilePicture: null,
  studentId: 'ADMIN001',
  program: 'Admin',
  department: 'Administration',
  batch: '2024',
  session: '2024',
  bloodGroup: 'O+'
};

// Add admin user to database
db.users.push(adminUser);
db.nextUserId++;

// Save the database
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Admin user created successfully!');
console.log('Email:    ', adminEmail);
console.log('Password: ', adminPassword);

