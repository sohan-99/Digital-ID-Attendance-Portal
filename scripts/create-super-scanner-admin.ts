import bcrypt from 'bcryptjs';
import { addScannerAdmin, findScannerAdminByUsername } from '../src/lib/db';

const superScannerAdmin = {
  username: 'super_scanner',
  password: 'SuperScanner@2025',
  location: 'All' as const,
  name: 'Super Scanner Admin',
  isSuperAdmin: true,
};

async function createSuperScannerAdmin() {
  console.log('🔐 Creating Super Scanner Admin Account...\n');
  
  const existing = await findScannerAdminByUsername(superScannerAdmin.username);
  
  if (existing) {
    console.log(`⚠️  Super Scanner Admin "${superScannerAdmin.username}" already exists.`);
    console.log(`   To recreate, please delete the existing account first.\n`);
    return;
  }
  
  const passwordHash = await bcrypt.hash(superScannerAdmin.password, 10);
  
  const created = await addScannerAdmin({
    username: superScannerAdmin.username,
    passwordHash,
    location: superScannerAdmin.location,
    name: superScannerAdmin.name,
    isSuperAdmin: superScannerAdmin.isSuperAdmin,
  });
  
  console.log(`✅ Created Super Scanner Admin!`);
  console.log(`   Name: ${superScannerAdmin.name}`);
  console.log(`   Location Access: All Locations`);
  console.log(`   Username: ${superScannerAdmin.username}`);
  console.log(`   Password: ${superScannerAdmin.password}`);
  console.log(`   ID: ${created.id}\n`);
  
  console.log('✨ Super Scanner Admin account creation completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 SUPER SCANNER ADMIN CREDENTIALS:');
  console.log(`   Username: ${superScannerAdmin.username}`);
  console.log(`   Password: ${superScannerAdmin.password}`);
  console.log('\n📝 Features:');
  console.log('   ✓ Access to ALL scanner locations');
  console.log('   ✓ Can scan at Campus, Library, and Event locations');
  console.log('   ✓ Auto-login when accessing /scanner page');
  console.log('   ✓ Full scanner dashboard access');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Save these credentials securely');
  console.log('   - Change password after first login in production');
  console.log('   - This account has elevated privileges');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createSuperScannerAdmin().catch(console.error);
