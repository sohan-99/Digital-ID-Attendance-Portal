import fs from 'fs';
import path from 'path';
import { getDatabase, COLLECTIONS } from '../src/lib/mongodb';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface OldUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  profilePicture?: string | null;
  studentId?: string | null;
  program?: string | null;
  department?: string | null;
  batch?: string | null;
  session?: string | null;
  bloodGroup?: string | null;
  qrToken?: string | null;
  qrTokenExpiry?: string | null;
}

interface OldScannerAdmin {
  id: number;
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event' | 'All';
  name: string;
  createdAt: string;
  isSuperAdmin?: boolean;
}

interface OldAttendance {
  id: number;
  userId: number;
  location: string | null;
  scannedAt: string;
  scannedBy?: number | null;
  scannerLocation?: string | null;
}

interface OldDatabase {
  users: OldUser[];
  scannerAdmins: OldScannerAdmin[];
  attendance: OldAttendance[];
  nextUserId: number;
  nextScannerAdminId: number;
  nextAttendanceId: number;
}

async function migrateData() {
  console.log('🔄 Starting migration from JSON to MongoDB...\n');

  // Read old JSON data
  if (!fs.existsSync(DB_PATH)) {
    console.log('❌ No db.json file found. Nothing to migrate.');
    return;
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const oldData: OldDatabase = JSON.parse(raw);

  console.log('📊 Data to migrate:');
  console.log(`   Users: ${oldData.users.length}`);
  console.log(`   Scanner Admins: ${oldData.scannerAdmins?.length || 0}`);
  console.log(`   Attendance Records: ${oldData.attendance.length}\n`);

  const db = await getDatabase();

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing MongoDB collections...');
    await db.collection(COLLECTIONS.USERS).deleteMany({});
    await db.collection(COLLECTIONS.SCANNER_ADMINS).deleteMany({});
    await db.collection(COLLECTIONS.ATTENDANCE).deleteMany({});
    await db.collection(COLLECTIONS.COUNTERS).deleteMany({});

    // Migrate Users
    if (oldData.users.length > 0) {
      console.log('👥 Migrating users...');
      await db.collection(COLLECTIONS.USERS).insertMany(oldData.users);
      console.log(`   ✓ Migrated ${oldData.users.length} users`);
    }

    // Migrate Scanner Admins
    if (oldData.scannerAdmins && oldData.scannerAdmins.length > 0) {
      console.log('🔐 Migrating scanner admins...');
      await db.collection(COLLECTIONS.SCANNER_ADMINS).insertMany(oldData.scannerAdmins);
      console.log(`   ✓ Migrated ${oldData.scannerAdmins.length} scanner admins`);
    }

    // Migrate Attendance
    if (oldData.attendance.length > 0) {
      console.log('📝 Migrating attendance records...');
      await db.collection(COLLECTIONS.ATTENDANCE).insertMany(oldData.attendance);
      console.log(`   ✓ Migrated ${oldData.attendance.length} attendance records`);
    }

    // Set up counters
    console.log('🔢 Setting up ID counters...');
    await db.collection(COLLECTIONS.COUNTERS).insertOne({
      _id: 'userId' as any,
      seq: oldData.nextUserId || oldData.users.length + 1,
    });
    await db.collection(COLLECTIONS.COUNTERS).insertOne({
      _id: 'scannerAdminId' as any,
      seq: oldData.nextScannerAdminId || (oldData.scannerAdmins?.length || 0) + 1,
    });
    await db.collection(COLLECTIONS.COUNTERS).insertOne({
      _id: 'attendanceId' as any,
      seq: oldData.nextAttendanceId || oldData.attendance.length + 1,
    });
    console.log('   ✓ ID counters configured');

    // Create indexes
    console.log('📇 Creating indexes...');
    await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });
    await db.collection(COLLECTIONS.USERS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.SCANNER_ADMINS).createIndex({ username: 1 }, { unique: true });
    await db.collection(COLLECTIONS.SCANNER_ADMINS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex({ userId: 1 });
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex({ scannedAt: -1 });
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex({ scannerLocation: 1 });
    console.log('   ✓ Indexes created');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Database: ${db.databaseName}`);
    console.log(`   Collections created: ${COLLECTIONS.USERS}, ${COLLECTIONS.SCANNER_ADMINS}, ${COLLECTIONS.ATTENDANCE}`);
    console.log('\n💡 Tip: You can now safely backup or remove data/db.json');
    
    // Backup the old file
    const backupPath = path.join(process.cwd(), 'data', 'db.json.backup');
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`\n📦 Backup created at: ${backupPath}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
