/**
 * Simple Email Test
 * Tests if nodemailer can send emails with your configuration
 * 
 * Usage: node scripts/simple-email-test.js your-email@example.com
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

// Get recipient from command line
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Please provide a recipient email address');
  console.log('Usage: node scripts/simple-email-test.js your-email@example.com');
  process.exit(1);
}

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');

console.log('📧 Email Configuration Test');
console.log('==========================');
console.log('Host:', EMAIL_HOST);
console.log('Port:', EMAIL_PORT);
console.log('User:', EMAIL_USER ? EMAIL_USER : '❌ NOT SET');
console.log('Pass:', EMAIL_PASS ? '✓ Set (hidden)' : '❌ NOT SET');
console.log('');

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌ Email configuration is incomplete!');
  console.log('');
  console.log('Please add to .env.local:');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=your-app-password');
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function testEmail() {
  try {
    console.log('🔍 Step 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    console.log('📤 Step 2: Sending test email...');
    const testOTP = '123456';
    
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Pundra University'}" <${EMAIL_USER}>`,
      to: recipientEmail,
      subject: 'Test Email - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1976d2;">Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          
          <div style="background-color: #e3f2fd; border: 2px dashed #1976d2; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Test OTP Code</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1976d2;">
              ${testOTP}
            </div>
          </div>
          
          <p><strong>✅ Success!</strong> Your email configuration is working properly.</p>
          <p>You can now use the OTP email verification feature.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated test message from Pundra University ID Card System.
          </p>
        </div>
      `,
      text: `
Email Configuration Test

This is a test email to verify your email configuration is working correctly.

Test OTP Code: ${testOTP}

✅ Success! Your email configuration is working properly.
You can now use the OTP email verification feature.

---
This is an automated test message from Pundra University ID Card System.
      `,
    });

    console.log('✅ Test email sent successfully!\n');
    console.log('📬 Details:');
    console.log('   Message ID:', info.messageId);
    console.log('   Sent to:', recipientEmail);
    console.log('   Test OTP:', testOTP);
    console.log('');
    console.log('🎉 Email configuration is working perfectly!');
    console.log('💡 Check your inbox (and spam folder) for the test email.');

  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('1. Gmail: Make sure you are using an App Password, not your regular password');
    console.log('2. Gmail: Enable 2-Step Verification first');
    console.log('3. Check if EMAIL_USER and EMAIL_PASS are correct in .env.local');
    console.log('4. Firewall may be blocking port', EMAIL_PORT);
    console.log('5. Try port 465 if 587 is not working');
    console.log('');
    console.log('For Gmail App Password:');
    console.log('https://myaccount.google.com/apppasswords');
    process.exit(1);
  }
}

testEmail();
