# 🚀 Quick Start Checklist - OTP Email Verification

## ✅ Pre-Setup Checklist

- [x] Nodemailer installed (`yarn add nodemailer`)
- [x] TypeScript types installed (`yarn add -D @types/nodemailer`)
- [x] All code files created and modified
- [x] Database schema updated
- [x] API routes implemented
- [x] Frontend UI updated

## 📝 What You Need to Do

### Step 1: Create Email Credentials (Choose One)

#### Option A: Gmail (Recommended for Testing)
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Click "App passwords"
4. Generate password for "Mail" → "Other"
5. Copy the 16-character password (without spaces)

#### Option B: Other Email Provider
- Use your SMTP credentials directly
- See `SETUP_EMAIL_OTP.md` for provider-specific settings

### Step 2: Create `.env.local` File

Create this file in the root directory (same level as `package.json`):

```env
# Copy your existing JWT_SECRET and MONGODB_URI
JWT_SECRET=your_existing_jwt_secret
MONGODB_URI=mongodb://localhost:27017/id_card_db

# Add these NEW lines:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=paste-your-16-char-app-password-here
EMAIL_FROM_NAME=Pundra University
```

**Important:** Replace these values:
- `your-email@gmail.com` → Your actual email
- `paste-your-16-char-app-password-here` → The app password from Step 1

### Step 3: Test Email Configuration

Run this command to test if email is working:

```bash
tsx scripts/test-email.ts your-email@example.com
```

✅ If successful, you'll see: "Test email sent successfully!"
❌ If failed, check the error message and fix your `.env.local`

### Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C or Cmd+C)
yarn dev
```

### Step 5: Test Complete Flow

1. **Register a New Student:**
   - Go to: http://localhost:3000/register
   - Fill in all fields (use a real email address)
   - Click "Register"
   - You should see: "Registration successful! Please check your email..."

2. **Check Your Email:**
   - Look for email from "Pundra University"
   - Subject: "Email Verification - OTP Code"
   - Find the 6-digit code
   - ⚠️ Check spam folder if not in inbox

3. **Verify Email:**
   - You'll be auto-redirected to profile page
   - You should see OTP input box (no QR code yet)
   - Enter the 6-digit OTP
   - Click "Verify Email"

4. **Access QR Code:**
   - After verification, QR code should appear
   - Download button should be enabled
   - Test downloading the QR code

## 🎯 What to Expect

### Before Email Verification:
- ✅ User can login
- ✅ User can see profile
- ❌ QR code is hidden
- 📧 OTP input box is shown
- 💬 Info message: "Please verify your email..."

### After Email Verification:
- ✅ QR code is visible
- ✅ Download button works
- ✅ Can scan QR for attendance
- ✅ All profile features available

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to send OTP email"
**Solution:**
- Check `.env.local` file exists and has correct values
- For Gmail: Ensure you're using App Password (not regular password)
- Verify 2-Step Verification is enabled
- Restart dev server after changing `.env.local`

### Issue 2: Email not arriving
**Solution:**
- Check spam/junk folder
- Wait 1-2 minutes (sometimes delayed)
- Verify email address is correct
- Click "Resend OTP" button in profile

### Issue 3: "Invalid OTP"
**Solution:**
- OTP expires after 15 minutes
- Click "Resend OTP" to get new code
- Check for typos (OTP is case-sensitive... just kidding, it's numbers only!)
- Copy-paste OTP from email

### Issue 4: QR code still not showing
**Solution:**
- Check browser console (F12) for errors
- Verify email is marked as verified
- Try logging out and logging back in
- Clear browser cache and localStorage

## 🧪 Testing Different Scenarios

### Test 1: Normal Registration Flow
- ✅ Register → Get OTP → Verify → See QR

### Test 2: OTP Expiry
- ✅ Wait 16 minutes → Try old OTP → Should fail
- ✅ Click Resend → Use new OTP → Should work

### Test 3: Resend OTP
- ✅ Click "Resend OTP" → New code in email
- ✅ Old OTP should not work
- ✅ New OTP should work

### Test 4: Admin Registration
- ✅ Register as admin → QR code immediately available
- ✅ No OTP required for admins

### Test 5: Multiple Resends
- ✅ Click resend multiple times
- ✅ Each time generates new OTP
- ✅ Only latest OTP works

## 📊 Success Indicators

You'll know it's working when:
- ✅ Registration shows success message about OTP
- ✅ Email arrives with 6-digit code
- ✅ OTP input box appears in profile
- ✅ Correct OTP shows success message
- ✅ QR code appears after verification
- ✅ Download QR button works
- ✅ No console errors

## 🎓 For Your Reference

### Important Files:
- Configuration: `.env.local`
- Email utility: `src/lib/email.ts`
- User model: `src/lib/db.ts`
- Register API: `src/app/api/auth/register/route.ts`
- Verify API: `src/app/api/auth/verify-otp/route.ts`
- Profile page: `src/app/profile/page.tsx`

### Documentation:
- `SETUP_EMAIL_OTP.md` - Detailed setup instructions
- `OTP_VERIFICATION_GUIDE.md` - Feature documentation
- `OTP_IMPLEMENTATION_SUMMARY.md` - Complete implementation details

## 🎉 You're All Set!

Once you complete these steps, your OTP email verification feature will be fully functional!

### Need Help?
1. Check error messages in browser console (F12)
2. Check server logs in terminal
3. Review the documentation files
4. Run the email test script
5. Verify `.env.local` configuration

### Ready to Go?
```bash
# Start your server
yarn dev

# Test email (in another terminal)
tsx scripts/test-email.ts your-email@example.com

# Open browser
http://localhost:3000/register
```

Good luck! 🚀
