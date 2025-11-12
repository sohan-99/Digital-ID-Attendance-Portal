import { addUser, findUserByEmail } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

const scannerAdmins = [
  {
    name: 'Campus Scanner Admin',
    email: 'campus@scanner.edu',
    password: 'Campus@123',
    scannerLocation: 'campus' as const,
  },
  {
    name: 'Library Scanner Admin',
    email: 'library@scanner.edu',
    password: 'Library@123',
    scannerLocation: 'library' as const,
  },
  {
    name: 'Event Scanner Admin',
    email: 'event@scanner.edu',
    password: 'Event@123',
    scannerLocation: 'event' as const,
  },
];

async function main() {
  console.log('Creating scanner admins...\n');

  for (const admin of scannerAdmins) {
    const existing = findUserByEmail(admin.email);
    if (existing) {
      console.log(`✓ ${admin.name} already exists (${admin.email})`);
      continue;
    }

    const passwordHash = hashPassword(admin.password);
    const user = addUser({
      name: admin.name,
      email: admin.email,
      passwordHash,
      isAdmin: true,
      role: 'admin',
      scannerLocation: admin.scannerLocation,
    });

    console.log(`✓ Created ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${admin.password}`);
    console.log(`  Scanner Location: ${admin.scannerLocation}`);
    console.log(`  User ID: ${user.id}\n`);
  }

  console.log('\n✅ Scanner admins created successfully!');
  console.log('\nLogin credentials:');
  console.log('==================');
  for (const admin of scannerAdmins) {
    console.log(`\n${admin.name}:`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${admin.password}`);
    console.log(`  Location: ${admin.scannerLocation.toUpperCase()}`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
