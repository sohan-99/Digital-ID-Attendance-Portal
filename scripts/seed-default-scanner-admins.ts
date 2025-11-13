import { getDatabase, COLLECTIONS } from '../src/lib/mongodb';
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  isAdmin: boolean;
  isScannerAdmin?: boolean;
  scannerLocation?: 'Campus' | 'Library' | 'Event' | 'All' | null;
  isSuperScanner?: boolean;
  studentId?: string | null;
  program?: string | null;
  department?: string | null;
  batch?: string | null;
  session?: string | null;
  bloodGroup?: string | null;
  profilePicture?: string | null;
  qrToken?: string | null;
  qrTokenExpiry?: string | null;
}

async function getNextUserId(db: any): Promise<number> {
  const counter = await db.collection(COLLECTIONS.COUNTERS).findOneAndUpdate(
    { _id: 'userId' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter.seq;
}

async function seedDefaultScannerAdmins() {
  console.log('🔄 Seeding default scanner admin credentials...\n');

  try {
    const db = await getDatabase();

    const defaultScannerAdmins = [
      {
        username: 'campus_scanner',
        password: 'Campus@2025',
        name: 'Campus Scanner',
        location: 'Campus' as const,
      },
      {
        username: 'library_scanner',
        password: 'Library@2025',
        name: 'Library Scanner',
        location: 'Library' as const,
      },
      {
        username: 'event_scanner',
        password: 'Event@2025',
        name: 'Event Scanner',
        location: 'Event' as const,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const admin of defaultScannerAdmins) {
      // Check if scanner admin already exists
      const existing = await db
        .collection<User>(COLLECTIONS.USERS)
        .findOne({ email: admin.username });

      if (existing) {
        console.log(`⚠️  Skipped: ${admin.username} (already exists)`);
        skipped++;
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(admin.password, 10);

      // Get next user ID
      const userId = await getNextUserId(db);

      // Create user with scanner admin flags
      const user: User = {
        id: userId,
        email: admin.username,
        name: admin.name,
        passwordHash: passwordHash,
        isAdmin: false,
        isScannerAdmin: true,
        scannerLocation: admin.location,
        isSuperScanner: false,
        studentId: null,
        program: null,
        department: null,
        batch: null,
        session: null,
        bloodGroup: null,
        profilePicture: null,
        qrToken: null,
        qrTokenExpiry: null,
      };

      await db.collection<User>(COLLECTIONS.USERS).insertOne(user);
      console.log(`✅ Created: ${admin.username} (${admin.location}) - ID: ${userId}`);
      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Created: ${created}`);
    console.log(`   • Skipped: ${skipped}`);
    console.log(`   • Total: ${defaultScannerAdmins.length}`);

    console.log(`\n✅ Default scanner admins seeded successfully!`);
    console.log(`\n📝 Scanner Login Credentials:`);
    console.log(`   Campus Scanner: campus_scanner / Campus@2025`);
    console.log(`   Library Scanner: library_scanner / Library@2025`);
    console.log(`   Event Scanner: event_scanner / Event@2025`);
    console.log(`\n🔗 Test at: http://localhost:3000/scanner-login\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDefaultScannerAdmins();
