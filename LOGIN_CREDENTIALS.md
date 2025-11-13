# Login Credentials

## 🔑 Default Admin Account

**Automatically created on system initialization:**

- **Email:** `admin@pundra.edu`
- **Password:** `Admin@123`

### Features:
- ✅ Full administrative access
- ✅ Manage users and attendance
- ✅ Access admin dashboard at `/admin`
- ✅ Auto-login as super scanner admin at `/scanner`
- ✅ View statistics and reports
- ✅ Export attendance data

## 🌟 Super Scanner Admin

For dedicated scanner operations at `/scanner-login`:

- **Username:** `super_scanner`
- **Password:** `SuperScanner@2025`
- **Location:** All Locations

### Features:
- ✅ Access all scanner locations (Campus, Library, Event)
- ✅ Flexible location switching
- ✅ Scanner dashboard at `/scanner-dashboard`
- ✅ Real-time attendance tracking

## 📍 Location-Specific Scanner Admins

### Campus Scanner
- **Username:** `campus_scanner`
- **Password:** `Campus@2025`
- **Location:** Campus only

### Library Scanner
- **Username:** `library_scanner`
- **Password:** `Library@2025`
- **Location:** Library only

### Event Scanner
- **Username:** `event_scanner`
- **Password:** `Event@2025`
- **Location:** Event only

## Default Student Accounts

If you've run the seed script (`npm run seed`), these test accounts are available:

- **Email:** `alice@pundra.edu` - **Password:** `Student@123`
- **Email:** `bob@pundra.edu` - **Password:** `Student@123`
- **Email:** `charlie@pundra.edu` - **Password:** `Student@123`

## Troubleshooting Login Issues

### "Invalid credentials" error

If you're getting "Invalid credentials" when logging in:

1. **Verify you're using the correct password:**
   - Admin password: `Admin@123` (capital A, capital A in Admin, @ symbol, 123)
   - Student password: `Student@123` (capital S, @ symbol, 123)

2. **Check if the admin user exists:**
   ```bash
   node scripts/verify-admin.js
   ```
   This script will check and fix any issues with the admin account.

3. **Recreate the admin user:**
   ```bash
   npm run create-admin
   ```

4. **Reseed the entire database:**
   ```bash
   npm run seed
   ```
   ⚠️ Warning: This will reset all data!

### Password Requirements

When creating new accounts, passwords must have:
- At least 6 characters
- At least one letter (A-Z or a-z)
- At least one number (0-9)
- At least one special character (e.g., @, #, $, !, etc.)

Examples of valid passwords:
- `Admin@123`
- `MyPass123!`
- `Secure#2024`

## Scanner Admin Accounts

Scanner admins are separate from regular admins. Check `SCANNER_ADMINS.md` for scanner login credentials.
