# 🔧 Fix: Failed to Send OTP Email

## Problem
The system cannot send OTP emails because email configuration is missing from `.env.local`.

## Quick Fix - Two Options

### Option 1: Use Console Logs (For Testing) ⚡ FASTEST

**No setup needed!** The system is already configured to work without email.

1. **How it works:**
   - When a user registers, the OTP will be printed in the server console
   - Check your terminal/console where `yarn dev` is running
   - Look for: `🔐 OTP (for testing): 123456`

2. **Steps to test:**
   ```bash
   # Just register a user
   # Check the server console for the OTP
   # Use that OTP to verify
   ```

**Pros:** Works immediately, no setup required
**Cons:** Only works in development, not suitable for production

---

### Option 2: Configure Real Email (Recommended) 📧

#### Quick Setup with Gmail:

1. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification" (if not already)
   - Click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Pundra University"
   - Copy the 16-character password

2. **Add to .env.local:**
   Open `/home/maruf0x01/Desktop/QR/id-card/.env.local` and add:
   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM_NAME=Pundra University
   ```

3. **Restart Server:**
   ```bash
   # Press Ctrl+C to stop
   yarn dev
   ```

4. **Test Email:**
   ```bash
   tsx scripts/test-email.ts your-email@example.com
   ```

#### Using the Setup Script:

```bash
# Run the interactive setup script
./scripts/setup-email.sh

# Or
bash scripts/setup-email.sh
```

---

## Current Behavior (Without Email Config)

✅ **What Still Works:**
- User registration
- User login
- Profile access
- OTP generation

⚠️ **What's Different:**
- OTP is printed in server console instead of email
- You manually copy OTP from console to verify

📝 **Server Console Output Example:**
```
⚠️  Email not configured. OTP would have been sent to: student@example.com
📧 OTP Code (for testing): 123456
💡 Configure EMAIL_USER and EMAIL_PASS in .env.local to enable email sending.
```

---

## Testing Without Email Configuration

1. **Register a User:**
   - Go to http://localhost:3000/register
   - Fill in the form
   - Click Register

2. **Check Server Console:**
   - Look at your terminal where `yarn dev` is running
   - Find the line with `🔐 OTP (for testing):`
   - Copy the 6-digit code

3. **Verify Email:**
   - Go to profile page (auto-redirected)
   - Paste the OTP from console
   - Click "Verify Email"

4. **Done!** ✅
   - QR code will appear
   - You can download it

---

## For Production Use

⚠️ **Important:** For production, you MUST configure real email.

**Recommended Email Services:**
- **SendGrid** - Free tier: 100 emails/day
- **AWS SES** - Very cheap, reliable
- **Mailgun** - Free tier: 100 emails/day
- **Gmail** - Good for small projects

---

## Quick Reference

### Current .env.local (Missing Email)
```env
JWT_SECRET=dev_secret_change_me
MONGODB_URI=mongodb+srv://...
MONGODB_DB=id_card_attendance
```

### Updated .env.local (With Email)
```env
JWT_SECRET=dev_secret_change_me
MONGODB_URI=mongodb+srv://...
MONGODB_DB=id_card_attendance

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM_NAME=Pundra University
```

---

## Troubleshooting

### "Failed to send OTP email" but OTP in console?
✅ **This is expected!** Use the OTP from console for testing.

### Want to enable real emails?
✅ Follow Option 2 above to configure email.

### Gmail not working?
- Use App Password (not regular password)
- Enable 2-Step Verification first
- Remove spaces from App Password
- Check if "Less secure app access" is not blocking

### Port 587 blocked?
- Try port 465 and set `EMAIL_PORT=465`
- Check firewall settings

---

## Summary

**For Development/Testing:** 
- ✅ Works without email configuration
- ✅ OTP shown in console
- ✅ No setup required

**For Production:**
- ⚠️ Configure real email
- ⚠️ Use Option 2 above
- ⚠️ Test with `tsx scripts/test-email.ts`

**Current Status:** 
✅ System is working! OTP verification is functional using console logs.

---

Need help? Check `SETUP_EMAIL_OTP.md` for detailed instructions.
