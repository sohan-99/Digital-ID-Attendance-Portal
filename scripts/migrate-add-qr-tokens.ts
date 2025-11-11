import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

// Read the current database
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(dbContent);

console.log('Adding qrToken and qrTokenExpiry fields to existing users...');

let updated = 0;

interface User {
  qrToken?: string | null;
  qrTokenExpiry?: string | null;
  [key: string]: unknown;
}

db.users = db.users.map((user: User) => {
  if (!user.qrToken) {
    user.qrToken = null;
    user.qrTokenExpiry = null;
    updated++;
  }
  return user;
});

// Save the database
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log(`✅ Migration complete! Updated ${updated} users.`);
console.log('');
console.log('QR tokens will be generated on first access and remain static.');
console.log('Tokens are valid for 1 year and stored in the database.');
