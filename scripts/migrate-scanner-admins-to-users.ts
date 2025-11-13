import { getDatabase, COLLECTIONS } from '../src/lib/mongodb';

interface ScannerAdmin {
  id: number;
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event' | 'All';
  name: string;
  createdAt: string;
  isSuperAdmin?: boolean;
}

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

async function migrateScannerAdminsToUsers() {
  console.log('🔄 Starting migration: Scanner Admins → Users Collection...\n');

  try {
    const db = await getDatabase();

    // Get all scanner admins from the old collection
    const scannerAdmins = await db
      .collection<ScannerAdmin>(COLLECTIONS.SCANNER_ADMINS)
      .find({})
      .toArray();

    if (scannerAdmins.length === 0) {
      console.log('ℹ️  No scanner admins found in scannerAdmins collection.');
      console.log('✅ Migration completed (nothing to migrate).\n');
      return;
    }

    console.log(`📋 Found ${scannerAdmins.length} scanner admin(s) to migrate:\n`);

    let migrated = 0;
    let skipped = 0;

    for (const scannerAdmin of scannerAdmins) {
      // Check if this user already exists in users collection
      const existingUser = await db
        .collection<User>(COLLECTIONS.USERS)
        .findOne({ email: scannerAdmin.username });

      if (existingUser) {
        console.log(`⚠️  Skipped: ${scannerAdmin.username} (already exists as user ID ${existingUser.id})`);
        
        // Update existing user to add scanner admin flags
        await db.collection<User>(COLLECTIONS.USERS).updateOne(
          { id: existingUser.id },
          {
            $set: {
              isScannerAdmin: true,
              scannerLocation: scannerAdmin.location,
              isSuperScanner: scannerAdmin.isSuperAdmin || false,
            },
          }
        );
        console.log(`   ✅ Updated user to add scanner admin flags`);
        skipped++;
        continue;
      }

      // Create new user with scanner admin flags
      const user: User = {
        id: scannerAdmin.id,
        email: scannerAdmin.username,
        name: scannerAdmin.name,
        passwordHash: scannerAdmin.passwordHash,
        isAdmin: false,
        isScannerAdmin: true,
        scannerLocation: scannerAdmin.location,
        isSuperScanner: scannerAdmin.isSuperAdmin || false,
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
      console.log(`✅ Migrated: ${scannerAdmin.username} → User ID ${scannerAdmin.id} (${scannerAdmin.location})`);
      migrated++;
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   • Migrated: ${migrated}`);
    console.log(`   • Skipped (already existed): ${skipped}`);
    console.log(`   • Total: ${scannerAdmins.length}`);

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`\n📝 Note: Scanner admins are now in the 'users' collection with:`);
    console.log(`   • isScannerAdmin: true`);
    console.log(`   • scannerLocation: Campus/Library/Event/All`);
    console.log(`   • isSuperScanner: true/false`);
    console.log(`\n⚠️  The old 'scannerAdmins' collection is still intact (not deleted).`);
    console.log(`   You can delete it manually if migration is successful.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateScannerAdminsToUsers();
