# MongoDB Integration Guide

## ✅ What's Been Done

1. **MongoDB Package Installed**
   - `mongodb` v7.0.0 added to dependencies
   - Installed with `--legacy-peer-deps` flag

2. **Environment Configuration**
   - Created `.env.local` with MongoDB connection string
   - Database: `id_card_attendance`

3. **MongoDB Connection Module** (`src/lib/mongodb.ts`)
   - Singleton connection pattern
   - Development/production mode handling
   - Collection names constants

4. **New Database Layer** (`src/lib/db.ts`)
   - Replaced JSON file-based storage with MongoDB
   - All functions now async (return Promises)
   - Maintains same interface as before

5. **Migration Script** (`scripts/migrate-to-mongodb.ts`)
   - Transfers data from JSON to MongoDB
   - Creates indexes for performance
   - Sets up ID counters

6. **Backup Created**
   - Original `db.ts` saved as `src/lib/db-json-backup.ts`

## 🔧 What Needs to Be Done

### Step 1: Add `await` to All Database Calls

Since all database functions are now async, you need to add `await` to every database call. Here's the pattern:

**Before:**
```typescript
const user = findUserById(userId);
```

**After:**
```typescript
const user = await findUserById(userId);
```

### Files That Need Updates:

1. ✅ `src/app/api/scanner/auth/login/route.ts` - FIXED
2. ✅ `src/app/api/scanner/scan/route.ts` - FIXED
3. ✅ `scripts/create-super-scanner-admin.ts` - FIXED
4. ⚠️ `src/lib/auth.ts`
5. ⚠️ `src/app/api/auth/register/route.ts`
6. ⚠️ `src/app/api/auth/login/route.ts`
7. ⚠️ `src/app/api/users/[id]/qrcode-token/route.ts`
8. ⚠️ `src/app/api/attendance/scan/route.ts`
9. ⚠️ `src/app/api/attendance/route.ts`
10. ⚠️ `src/app/api/users/me/route.ts`
11. ⚠️ `src/app/api/users/me/profile-picture/route.ts`
12. ⚠️ `src/app/api/admin/users/route.ts`
13. ⚠️ `src/app/api/admin/users/[id]/route.ts`
14. ⚠️ `src/app/api/admin/attendance/route.ts`
15. ⚠️ `src/app/api/admin/attendance/daily/route.ts`
16. ⚠️ `src/app/api/admin/attendance/by-department/route.ts`
17. ⚠️ `src/app/api/admin/export-attendance/route.ts`
18. ⚠️ `src/app/api/admin/stats/route.ts`
19. ⚠️ `src/app/api/scanner/attendance/route.ts`

### Step 2: Run Migration

After fixing all the `await` statements, run:

```bash
yarn migrate-to-mongodb
```

This will:
- Transfer all users from `data/db.json` to MongoDB
- Transfer scanner admins
- Transfer attendance records
- Set up ID counters
- Create indexes
- Backup the JSON file

### Step 3: Test the Application

```bash
yarn dev
```

Test these features:
- [ ] User login
- [ ] User registration
- [ ] QR code scanning
- [ ] Attendance recording
- [ ] Admin dashboard
- [ ] Scanner admin login
- [ ] Super scanner admin

### Step 4: Remove Old Code (Optional)

Once everything works:
```bash
rm src/lib/db-json-backup.ts
rm src/lib/db-mongo.ts
rm data/db.json.backup  # Keep original as backup
```

## 🚀 Quick Fix Script

You can use this sed command to automatically add `await` to most database calls:

```bash
# Backup first
find src/app/api -name "*.ts" -exec cp {} {}.bak \;

# Add await to common patterns
find src/app/api -name "*.ts" -exec sed -i 's/const \(.*\) = \(findUser\|addUser\|updateUser\|deleteUser\|getAttendance\|addAttendance\|countUsers\|countAttendance\|recentCounts\|findScannerAdmin\|allUsers\|allScannerAdmins\)/const \1 = await \2/g' {} \;

# Check for remaining issues
grep -r "= find\|= add\|= update\|= delete\|= get\|= count\|= recent\|= all" src/app/api
```

## 📋 Manual Fix Example

**File: `src/app/api/auth/login/route.ts`**

Before:
```typescript
export async function POST(req: NextRequest) {
  init();
  const body = await req.json();
  const user = findUserByEmail(body.email);
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  // ...
}
```

After:
```typescript
export async function POST(req: NextRequest) {
  await init(); // Add await
  const body = await req.json();
  const user = await findUserByEmail(body.email); // Add await
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  // ...
}
```

## 🔍 Finding Database Calls

Use this command to find all database function calls:

```bash
grep -rn "findUserById\|findUserByEmail\|addUser\|updateUser\|deleteUser\|getAttendance\|addAttendance\|init\|countUsers\|countAttendance\|recentCounts\|findScannerAdmin\|addScannerAdmin\|allUsers\|allScannerAdmins\|getAttendanceByLocation\|getTodayAttendanceByLocation" src/app/api src/lib --include="*.ts" | grep -v "await"
```

## ⚠️ Common Issues

### Issue 1: "Property X does not exist on type 'Promise<...>'"
**Cause:** Missing `await` before database call
**Fix:** Add `await` before the function call

### Issue 2: "This condition will always return true"
**Cause:** Checking a Promise instead of the resolved value
**Fix:** Add `await` before the function call

### Issue 3: Migration fails with "duplicate key error"
**Cause:** Data already exists in MongoDB
**Fix:** Drop the collections first:
```javascript
// In MongoDB shell or script
db.users.drop();
db.scannerAdmins.drop();
db.attendance.drop();
db.counters.drop();
```

## 🎯 MongoDB Benefits

1. **Scalability**: Handle millions of records
2. **Performance**: Indexed queries are fast
3. **Reliability**: Built-in replication and backup
4. **Cloud-Ready**: Easy to deploy on MongoDB Atlas
5. **Flexibility**: Schema evolution without migrations

## 📞 Need Help?

If you encounter issues:
1. Check TypeScript errors: `yarn build`
2. Check console logs when running the app
3. Verify MongoDB connection in `.env.local`
4. Test MongoDB connection:
```bash
mongosh "mongodb+srv://marufhasanpubcse_db_user:pIwINNzjrabyYq2J@cluster0.tdbmsf8.mongodb.net/"
```

## ✨ Final Steps

After everything works:
1. Update `README.md` with MongoDB setup instructions
2. Add `.env.local` to `.gitignore` (if not already)
3. Document the MongoDB connection string securely
4. Set up MongoDB Atlas backup policy
5. Consider adding MongoDB indexes for performance

Good luck! 🚀
