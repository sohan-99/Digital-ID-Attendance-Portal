import bcrypt from 'bcryptjs';
import { addScannerAdmin, findScannerAdminByUsername } from '../src/lib/db';

const scannerAdmins = [
  {
    username: 'campus_scanner',
    password: 'Campus@2025',
    location: 'Campus' as const,
    name: 'Campus Scanner Admin',
  },
  {
    username: 'library_scanner',
    password: 'Library@2025',
    location: 'Library' as const,
    name: 'Library Scanner Admin',
  },
  {
    username: 'event_scanner',
    password: 'Event@2025',
    location: 'Event' as const,
    name: 'Event Scanner Admin',
  },
];

async function createScannerAdmins() {
  console.log('🔐 Creating Scanner Admin Accounts...\n');
  
  for (const admin of scannerAdmins) {
    const existing = findScannerAdminByUsername(admin.username);
    
    if (existing) {
      console.log(`⚠️  Scanner Admin "${admin.username}" already exists. Skipping...`);
      continue;
    }
    
    const passwordHash = await bcrypt.hash(admin.password, 10);
    
    const created = addScannerAdmin({
      username: admin.username,
      passwordHash,
      location: admin.location,
      name: admin.name,
    });
    
    console.log(`✅ Created Scanner Admin: ${admin.name}`);
    console.log(`   Location: ${admin.location}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: ${admin.password}`);
    console.log(`   ID: ${created.id}\n`);
  }
  
  console.log('✨ Scanner Admin accounts creation completed!\n');
  console.log('📝 IMPORTANT: Please save these credentials securely:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  scannerAdmins.forEach(admin => {
    console.log(`\n${admin.location} Scanner:`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Password: ${admin.password}`);
  });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createScannerAdmins().catch(console.error);
