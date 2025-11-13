import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

console.log('📋 Verifying admin credentials...\n');

// Read the current database
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(dbContent);

const adminEmail = 'admin@pundra.edu';
const correctPassword = 'Admin@123';

// Find admin user
const admin = db.users.find((u: { email: string }) => u.email === adminEmail);

if (!admin) {
  console.log('❌ Admin user not found!');
  console.log('Run: npm run create-admin');
  process.exit(1);
}

console.log('✅ Admin user found:');
console.log('   ID:', admin.id);
console.log('   Name:', admin.name);
console.log('   Email:', admin.email);
console.log('   Is Admin:', admin.isAdmin);

// Test the password
const passwordMatches = bcrypt.compareSync(correctPassword, admin.passwordHash);

console.log('\n🔐 Password verification:');
console.log('   Expected password:', correctPassword);
console.log('   Hash in database:', admin.passwordHash.substring(0, 20) + '...');
console.log('   Password matches:', passwordMatches ? '✅ YES' : '❌ NO');

if (!passwordMatches) {
  console.log('\n⚠️  Password hash does not match!');
  console.log('   Regenerating correct hash...');
  
  const newHash = bcrypt.hashSync(correctPassword, 10);
  admin.passwordHash = newHash;
  
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  console.log('   ✅ Password hash updated!');
  console.log('   New hash:', newHash.substring(0, 20) + '...');
  
  // Verify again
  const verified = bcrypt.compareSync(correctPassword, newHash);
  console.log('   Verification:', verified ? '✅ PASS' : '❌ FAIL');
}

console.log('\n📝 Login credentials:');
console.log('   Email:    ', adminEmail);
console.log('   Password: ', correctPassword);
console.log('\n');
