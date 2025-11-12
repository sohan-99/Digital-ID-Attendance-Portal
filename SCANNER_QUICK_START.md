# Scanner Admin Quick Start Guide

Get up and running with the Scanner Admin System in 5 minutes!

## 🚀 Quick Setup

### Step 1: Create Scanner Admin Accounts

Run the setup script to create scanner admin accounts:

```bash
npm run create-scanner-admins
```

Or using tsx directly:

```bash
npx tsx scripts/create-scanner-admins.ts
```

You should see output like:

```
🔐 Creating Scanner Admin Accounts...

✅ Created Scanner Admin: Campus Scanner Admin
   Location: Campus
   Username: campus_scanner
   Password: Campus@2025
   ID: 1

✅ Created Scanner Admin: Library Scanner Admin
   Location: Library
   Username: library_scanner
   Password: Library@2025
   ID: 2

✅ Created Scanner Admin: Event Scanner Admin
   Location: Event
   Username: event_scanner
   Password: Event@2025
   ID: 3
```

### Step 2: Login as Scanner Admin

1. Open your browser and navigate to: `http://localhost:3000/scanner-login`
2. Choose your location (Campus, Library, or Event)
3. Enter credentials:
   - **Campus**: `campus_scanner` / `Campus@2025`
   - **Library**: `library_scanner` / `Library@2025`
   - **Event**: `event_scanner` / `Event@2025`
4. Click "Login"

### Step 3: Start Scanning

1. After login, you'll see the Scanner Dashboard
2. Click "Start Scanning" or "Scan QR Code"
3. Allow camera permissions when prompted
4. Point camera at student's QR code
5. Attendance is automatically recorded!

## 📱 Scanner Interface Features

### Dashboard View

- **Today's Scans**: Count of scans for current day
- **Recent Scans**: List of latest 10 scans
- **Search**: Find specific student records
- **Date Filter**: View scans by date

### Scanning View

- **Camera Preview**: Live camera feed
- **QR Detection**: Automatic QR code recognition
- **Instant Feedback**: Success/error messages
- **Scan History**: Recently scanned students

## 🎯 Common Tasks

### Scanning a Student

1. Click **"Scan QR Code"** button
2. Student presents their QR code
3. Align QR code within camera frame
4. Wait for automatic detection
5. See success message with student name
6. Repeat for next student

### Viewing Today's Attendance

1. From dashboard, view "Today's Scans" section
2. See list of all scanned students
3. Click on any record to see details
4. Export data if needed (coming soon)

### Searching for a Student

1. Use search bar at top of dashboard
2. Enter student name or ID
3. Filter results by date range
4. View attendance history

### Manual Entry (Backup)

If QR scanner fails:

1. Click **"Manual Entry"** button
2. Enter student ID or email
3. Verify student details
4. Click **"Record Attendance"**

## 🔑 Login Credentials

Remember your credentials or keep this handy:

| Location | Username | Password |
|----------|----------|----------|
| 🏫 Campus | `campus_scanner` | `Campus@2025` |
| 📚 Library | `library_scanner` | `Library@2025` |
| 🎉 Event | `event_scanner` | `Event@2025` |

> 💡 **Tip**: Bookmark your scanner login page for quick access!

## ⚡ Keyboard Shortcuts

- `Space` - Start/Stop scanning
- `Enter` - Manual entry mode
- `Esc` - Close camera/modal
- `Ctrl+F` - Focus search bar

## 📊 Understanding the Data

### Scan Records Show:

- **Student Name**: Full name of the student
- **Student ID**: Unique identifier
- **Time**: When scan occurred
- **Location**: Your scanner location (Campus/Library/Event)
- **Scanner**: Your admin username

## ⚠️ Troubleshooting

### Camera Not Working

1. Check browser permissions
2. Refresh page and allow camera access
3. Try different browser (Chrome recommended)
4. Check camera is not used by another app

### QR Code Not Scanning

1. Ensure good lighting
2. Hold phone/paper steady
3. Adjust distance (6-12 inches ideal)
4. Clean camera lens
5. Use manual entry as backup

### Cannot Login

1. Verify you're using correct username
2. Check password (case-sensitive)
3. Ensure you're on scanner login page
4. Clear browser cache and cookies
5. Contact admin if still issues

### Student Not Found

1. Verify QR code is current
2. Check student account is active
3. Try manual entry with student ID
4. Contact admin for verification

## 🎨 Best Practices

### Before Each Session

✅ Test camera before students arrive  
✅ Ensure good lighting in scanning area  
✅ Have backup manual entry ready  
✅ Check internet connection  

### During Scanning

✅ Keep device charged/plugged in  
✅ Verify student identity  
✅ Watch for duplicate scans  
✅ Handle failed scans gracefully  

### After Session

✅ Review scan count  
✅ Report any issues  
✅ Log out properly  
✅ Note any unusual incidents  

## 📞 Getting Help

### If You Need Assistance:

1. **Technical Issues**: Check this guide first
2. **Student Issues**: Use manual entry
3. **System Down**: Contact system admin
4. **Security Concerns**: Report immediately

### Emergency Contacts

- **System Admin**: [Your contact info]
- **IT Support**: [Your contact info]
- **Help Desk**: [Your contact info]

## 🔒 Security Reminders

- ⚠️ Never share your password
- ⚠️ Always log out when done
- ⚠️ Don't leave scanner unattended
- ⚠️ Report suspicious QR codes
- ⚠️ Verify student identity

## 📈 Tips for Efficiency

### Speed Up Scanning:

1. **Organize Queue**: Have students ready with QR codes
2. **Good Lighting**: Set up near windows or good lights
3. **Stable Position**: Mount device on stand if possible
4. **Practice**: Get familiar with optimal scanning distance
5. **Batch Process**: Scan groups during peak times

### Reduce Errors:

1. Ask students to brighten phone screens
2. Check for damaged/unclear QR codes
3. Keep backup manual entry method ready
4. Double-check duplicate scans
5. Verify suspicious entries

## 🎓 Training Checklist

Before your first shift, ensure you can:

- [ ] Log in successfully
- [ ] Access scanner dashboard
- [ ] Start camera/QR scanner
- [ ] Scan a test QR code
- [ ] View scan history
- [ ] Search for a student
- [ ] Perform manual entry
- [ ] Log out properly

## 📝 Quick Reference Commands

```bash
# Create scanner admins
npm run create-scanner-admins

# Start development server
npm run dev

# View database
cat data/db.json

# Backup database
cp data/db.json data/db.backup.json
```

## 🌟 Success Metrics

You're doing great when:

- ✅ Scans complete in under 3 seconds each
- ✅ Less than 5% manual entries needed
- ✅ No duplicate scans
- ✅ All students processed within timeframe
- ✅ Zero security incidents

## 📚 Additional Resources

- Full documentation: `SCANNER_ADMINS.md`
- System architecture: `README.md`
- API documentation: `/docs/api`
- Video tutorials: [Coming soon]

---

**Ready to Start?** Head to `/scanner-login` and begin scanning! 🎉

**Questions?** Check `SCANNER_ADMINS.md` for detailed documentation.

**Issues?** Contact your system administrator.

---

*Last updated: November 2025*  
*Version: 1.0.0*
