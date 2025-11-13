# Email OTP Verification Feature

## Overview

This feature implements email verification via OTP (One-Time Password) for new student registrations. Students must verify their email before they can access their QR code.

## How It Works

1. **Registration**: When a new student registers, an OTP is automatically generated and sent to their email
2. **Auto Login**: The student is logged in automatically after registration
3. **Profile Access**: Student can access their profile but won't see the QR code
4. **OTP Verification**: An OTP input box is displayed where the QR code would normally appear
5. **QR Code Generation**: After entering the correct OTP, the QR code is generated and displayed
6. **Download**: Student can now download their QR code

## Setup Instructions

### 1. Install Dependencies

The required package `nodemailer` should already be installed. If not:

```bash
yarn add nodemailer
yarn add -D @types/nodemailer
```

### 2. Configure Email Settings

#### For Gmail Users:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. Create a `.env.local` file in the project root:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM_NAME=Pundra University
```

#### For Other Email Providers:

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

**Custom SMTP:**
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

### 3. Test Email Configuration

You can test your email configuration by accessing the health endpoint:

```bash
curl http://localhost:3000/api/health
```

## API Endpoints

### 1. Register (Modified)
- **Endpoint**: `POST /api/auth/register`
- **Changes**: Now generates OTP and sends email
- **Response**: Includes `emailVerified: false` for new users

### 2. Verify OTP
- **Endpoint**: `POST /api/auth/verify-otp`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "otp": "123456" }`
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Email verified successfully",
    "qrToken": "..."
  }
  ```

### 3. Resend OTP
- **Endpoint**: `POST /api/auth/resend-otp`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "success": true,
    "message": "New OTP sent to your email"
  }
  ```

### 4. Get QR Code Token (Modified)
- **Endpoint**: `GET /api/users/{id}/qrcode-token`
- **Changes**: Returns error if email not verified
- **Response**: 
  - Success: `{ "qrcodeToken": "..." }`
  - Not verified: `{ "error": "Email not verified", "emailVerified": false }` (403)

## Database Changes

### User Model Updates

Added the following fields to the User interface:

```typescript
interface User {
  // ... existing fields
  emailVerified?: boolean;    // Email verification status
  otp?: string | null;        // Current OTP code
  otpExpiry?: Date | null;    // OTP expiration time
}
```

## User Experience Flow

### New Student Registration:

1. Student fills registration form
2. System creates account and sends OTP email
3. Student is logged in automatically
4. Student sees profile but no QR code
5. OTP input box is displayed with instructions
6. Student checks email and enters OTP
7. System verifies OTP and generates QR code
8. QR code is displayed and downloadable

### OTP Features:

- **Validity**: OTP is valid for 15 minutes
- **Format**: 6-digit numeric code
- **Resend**: Students can request a new OTP anytime
- **Security**: OTP is cleared after successful verification

## Admin Users

Admin users bypass email verification:
- No OTP sent on registration
- QR code available immediately
- `emailVerified` is not checked for admins

## Security Considerations

1. **OTP Expiry**: OTPs expire after 15 minutes
2. **One-Time Use**: OTP is cleared after successful verification
3. **Rate Limiting**: Consider adding rate limiting to prevent OTP spam
4. **Email Privacy**: Never log or expose OTPs in responses
5. **HTTPS**: Always use HTTPS in production for email transmission

## Troubleshooting

### Email Not Sending

1. Check environment variables are set correctly
2. Verify SMTP credentials
3. For Gmail, ensure App Password is used (not regular password)
4. Check spam/junk folder
5. Verify port 587 is not blocked by firewall

### OTP Invalid Error

1. Check if OTP has expired (15 minutes)
2. Ensure OTP is exactly 6 digits
3. Request a new OTP using resend feature
4. Check for typos in OTP entry

### Console Logs

The system logs email operations:
- `OTP email sent: <messageId>` - Success
- `Error sending OTP email:` - Failure
- Check server console for detailed error messages

## Production Deployment

Before deploying to production:

1. **Environment Variables**: Set all email configuration in production environment
2. **Email Service**: Consider using dedicated email services like:
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark
3. **Rate Limiting**: Implement rate limiting on OTP endpoints
4. **Monitoring**: Set up monitoring for email delivery failures
5. **Backup**: Have a fallback verification method

## Future Enhancements

Potential improvements:
- SMS OTP as alternative
- Email verification link option
- OTP attempt limiting
- Account recovery via email
- Email change with verification
- Multi-language email templates

## Support

For issues or questions:
1. Check environment variables configuration
2. Review server logs for error messages
3. Test email configuration using health endpoint
4. Verify SMTP server accessibility
