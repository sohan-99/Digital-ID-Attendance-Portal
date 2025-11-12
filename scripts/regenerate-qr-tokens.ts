import { allUsers, updateUser } from '../src/lib/db';
import { generateQRToken } from '../src/lib/auth';

/**
 * Script to regenerate QR tokens for all users with shorter tokens
 * Run with: npx tsx scripts/regenerate-qr-tokens.ts
 */

function regenerateQRTokens() {
  console.log('🔄 Starting QR token regeneration...\n');

  const users = allUsers();
  let regeneratedCount = 0;

  for (const user of users) {
    try {
      // Generate new short token (only contains user ID)
      const newToken = generateQRToken(user.id, '365d');

      // Set expiry to 1 year from now
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      // Update user with new token
      updateUser(user.id, {
        qrToken: newToken,
        qrTokenExpiry: expiry.toISOString(),
      });

      console.log(`✓ Regenerated token for user: ${user.name} (ID: ${user.id})`);
      console.log(`  Old token length: ${user.qrToken?.length || 0} characters`);
      console.log(`  New token length: ${newToken.length} characters`);
      console.log(`  Token reduction: ${((user.qrToken?.length || 0) - newToken.length)} characters\n`);

      regeneratedCount++;
    } catch (error) {
      console.error(`✗ Failed to regenerate token for user ${user.id}:`, error);
    }
  }

  console.log('\n✅ QR token regeneration completed!');
  console.log(`📊 Total users processed: ${users.length}`);
  console.log(`📊 Tokens regenerated: ${regeneratedCount}`);
  console.log('\n💡 Users will need to refresh their profile page to see the new QR code.');
}

regenerateQRTokens();
