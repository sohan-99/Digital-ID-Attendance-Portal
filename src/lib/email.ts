import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');

// Check if email is configured
const isEmailConfigured = !!(EMAIL_USER && EMAIL_PASS);

// Create reusable transporter only if configured
let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates (development only)
      },
    });
    console.log('✅ Email transporter created successfully');
  } catch (error) {
    console.error('❌ Error creating email transporter:', error);
  }
} else {
  console.warn('⚠️  Email is not configured. OTP emails will not be sent.');
  console.warn('⚠️  Please add EMAIL_USER and EMAIL_PASS to your .env.local file.');
  console.warn('💡 For now, OTPs will be displayed in the console for testing.');
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
  // Check if email is configured
  if (!transporter) {
    console.log('⚠️  Email not configured. OTP would have been sent to:', email);
    console.log('📧 OTP Code (for testing):', otp);
    console.log('💡 Configure EMAIL_USER and EMAIL_PASS in .env.local to enable email sending.');
    return false;
  }

  try {
    console.log(`📧 Attempting to send OTP email to: ${email}`);
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Pundra University'}" <${EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #1976d2;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .otp-box {
              background-color: #e3f2fd;
              border: 2px dashed #1976d2;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 5px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 5px;
              color: #1976d2;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Pundra University!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Thank you for registering with our Digital ID and Attendance Portal. To complete your registration and access your QR code, please verify your email address.</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your One-Time Password (OTP)</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>Please enter this OTP in your profile page to verify your email and generate your QR code.</p>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for 15 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              
              <p>Best regards,<br>Pundra University Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Dear ${name},

Thank you for registering with our Digital ID and Attendance Portal.

Your OTP for email verification is: ${otp}

This OTP is valid for 15 minutes. Please enter it in your profile page to verify your email and generate your QR code.

Do not share this code with anyone.

Best regards,
Pundra University Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    console.log('💡 OTP for testing:', otp);
    return false;
  }
}

// Verify transporter configuration
export async function verifyEmailConfig(): Promise<boolean> {
  if (!transporter) {
    console.log('Email is not configured');
    return false;
  }
  
  try {
    await transporter.verify();
    console.log('Email server is ready');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
