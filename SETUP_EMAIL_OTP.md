# Quick Setup Guide for OTP Email Feature

## Step 1: Create `.env.local` file

Create a file named `.env.local` in the root directory of the project (same level as `package.json`).

## Step 2: Add Email Configuration

Copy and paste the following into your `.env.local` file:

```env
# JWT Secret (keep the existing one or create a new one)
JWT_SECRET=your_jwt_secret_here

# MongoDB (keep the existing one)
MONGODB_URI=mongodb://localhost:27017/id_card_db

# === EMAIL CONFIGURATION (ADD THESE) ===

# For Gmail Users:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM_NAME=Pundra University

# For Outlook/Hotmail Users (alternative):
# EMAIL_HOST=smtp-mail.outlook.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@outlook.com
# EMAIL_PASS=your-password

# For Yahoo Users (alternative):
# EMAIL_HOST=smtp.mail.yahoo.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@yahoo.com
# EMAIL_PASS=your-app-password
```

## Step 3: Get Gmail App Password

If you're using Gmail:

1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification" if not already enabled
4. Go back to Security page
5. Under "Signing in to Google", click "App passwords"
6. Select "Mail" and "Other (Custom name)"
7. Name it "Pundra University App"
8. Click "Generate"
9. Copy the 16-character password (remove spaces)
10. Paste it as `EMAIL_PASS` in your `.env.local` file

## Step 4: Update `.env.local` with Your Details

Replace the placeholder values:
- `your-email@gmail.com` → Your actual Gmail address
- `your-app-password-here` → The 16-character app password from Step 3

## Step 5: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
yarn dev
```

## Step 6: Test Registration

1. Go to http://localhost:3000/register
2. Fill in the registration form
3. Submit the form
4. Check your email for the OTP code
5. Go to your profile page
6. Enter the OTP code
7. Your QR code should now be visible!

## Example `.env.local` (with real values)

```env
JWT_SECRET=my_super_secret_jwt_key_12345
MONGODB_URI=mongodb://localhost:27017/id_card_db

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=pundra.university@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Pundra University
```

## Troubleshooting

### "Failed to send OTP email"
- Check if EMAIL_USER and EMAIL_PASS are correct
- Verify you're using an App Password (not your regular password)
- Check if 2-Step Verification is enabled on your Google account

### "Can't find .env.local"
- Make sure it's in the root directory (same folder as package.json)
- File name must be exactly `.env.local` (with the dot at the start)
- On Windows, ensure file extensions are visible

### Email not arriving
- Check spam/junk folder
- Verify the email address in registration is correct
- Wait a few minutes (sometimes there's a delay)

### Port 587 blocked
- Your firewall might be blocking port 587
- Try using port 465 and set EMAIL_PORT=465
- Contact your network administrator

## Testing Without Real Emails

During development, you can use services like:
- **Mailtrap**: https://mailtrap.io/ (Free for development)
- **MailHog**: Local email testing server

Just update your EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS accordingly.

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env.local` to git (it's already in .gitignore)
- Never share your App Password
- Use different credentials for production
- Rotate your App Password periodically

## Need Help?

If you still have issues:
1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Ensure nodemailer package is installed (`yarn add nodemailer`)
4. Make sure MongoDB is running
