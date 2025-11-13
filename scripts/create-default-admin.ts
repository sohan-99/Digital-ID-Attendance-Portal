import bcrypt from 'bcryptjs';
import { addUser, findUserByEmail } from '../src/lib/db';

const defaultAdmin = {
  name: 'Super Admin',
  email: 'admin@pundra.edu',
  password: 'Admin@123',
  isAdmin: true,
};

async function createDefaultAdmin() {
  console.log('🔐 Creating Default Admin Account...\n');
  
  // Check if admin already exists
  const existing = await findUserByEmail(defaultAdmin.email);
  
  if (existing) {
    console.log(`⚠️  Admin user "${defaultAdmin.email}" already exists.`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   Email: ${existing.email}`);
    console.log(`   ID: ${existing.id}`);
    console.log(`   Admin: ${existing.isAdmin ? 'Yes' : 'No'}\n`);
    console.log('💡 Use this account to login to the system.\n');
    return;
  }
  
  // Hash the password
  const passwordHash = await bcrypt.hash(defaultAdmin.password, 10);
  
  // Create admin user
  const created = await addUser({
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    passwordHash,
    isAdmin: defaultAdmin.isAdmin,
  });
  
  console.log(`✅ Created Default Admin Account!`);
  console.log(`   Name: ${defaultAdmin.name}`);
  console.log(`   Email: ${defaultAdmin.email}`);
  console.log(`   Password: ${defaultAdmin.password}`);
  console.log(`   ID: ${created.id}`);
  console.log(`   Admin: Yes\n`);
  
  console.log('✨ Default admin account creation completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 DEFAULT ADMIN CREDENTIALS:');
  console.log(`   Email: ${defaultAdmin.email}`);
  console.log(`   Password: ${defaultAdmin.password}`);
  console.log('\n📝 Features:');
  console.log('   ✓ Full admin access to the system');
  console.log('   ✓ Can manage users and attendance');
  console.log('   ✓ Access to admin dashboard');
  console.log('   ✓ Auto-login as super scanner admin');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Use this account to login at /login');
  console.log('   - Change password after first login in production');
  console.log('   - Keep credentials secure');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createDefaultAdmin().catch(console.error);
