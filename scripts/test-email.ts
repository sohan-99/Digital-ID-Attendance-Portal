/**
 * Email Configuration Test Utility
 * 
 * This script tests if your email configuration is working correctly.
 * Run this after setting up your .env.local file.
 * 
 * Usage:
 *   tsx scripts/test-email.ts your-email@example.com
 */

import { sendOTPEmail, verifyEmailConfig } from '../src/lib/email';

async function testEmailConfig() {
  console.log('🔍 Testing email configuration...\n');

  // Get recipient email from command line argument
  const recipientEmail = process.argv[2];
  
  if (!recipientEmail) {
    console.error('❌ Error: Please provide a recipient email address');
    console.log('Usage: tsx scripts/test-email.ts your-email@example.com');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  try {
    // Step 1: Verify email server connection
    console.log('Step 1: Verifying email server connection...');
    const isConfigValid = await verifyEmailConfig();
    
    if (!isConfigValid) {
      console.error('❌ Email server configuration is invalid');
      console.log('\nPlease check your .env.local file:');
      console.log('- EMAIL_HOST');
      console.log('- EMAIL_PORT');
      console.log('- EMAIL_USER');
      console.log('- EMAIL_PASS');
      process.exit(1);
    }
    
    console.log('✅ Email server connection successful\n');

    // Step 2: Send test OTP email
    console.log('Step 2: Sending test OTP email...');
    const testOTP = '123456';
    const testName = 'Test User';
    
    const emailSent = await sendOTPEmail(recipientEmail, testOTP, testName);
    
    if (!emailSent) {
      console.error('❌ Failed to send test email');
      process.exit(1);
    }
    
    console.log('✅ Test email sent successfully!\n');
    console.log('📧 Please check the inbox for:', recipientEmail);
    console.log('📝 Test OTP:', testOTP);
    console.log('\n✨ Email configuration is working correctly!');
    
  } catch (error) {
    console.error('❌ Error during email test:', error);
    
    if (error instanceof Error) {
      console.log('\nError details:', error.message);
    }
    
    console.log('\nCommon issues:');
    console.log('1. Check if EMAIL_USER and EMAIL_PASS are correct in .env.local');
    console.log('2. For Gmail, use App Password (not regular password)');
    console.log('3. Verify 2-Step Verification is enabled (for Gmail)');
    console.log('4. Check if port 587 is not blocked by firewall');
    console.log('5. Try using port 465 with secure connection');
    
    process.exit(1);
  }
}

// Run the test
testEmailConfig();
