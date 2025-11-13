# Login Credentials

## Default Admin Account

After running the seed or create-admin script, use these credentials:

- **Email:** `admin@pundra.edu`
- **Password:** `Admin@123`

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
