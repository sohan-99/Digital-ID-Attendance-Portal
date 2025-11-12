# Scanner Admin System

## Overview

The system now supports **3 dedicated scanner admins** for different locations:
- **Campus Scanner** - For campus-wide attendance
- **Library Scanner** - For library attendance
- **Event Scanner** - For event attendance

Each scanner admin can only view and manage attendance records from their specific scanner location.

## Scanner Admin Accounts

### 1. Campus Scanner Admin
- **Email:** `campus@scanner.edu`
- **Password:** `Campus@123`
- **Scanner Location:** CAMPUS

### 2. Library Scanner Admin
- **Email:** `library@scanner.edu`
- **Password:** `Library@123`
- **Scanner Location:** LIBRARY

### 3. Event Scanner Admin
- **Email:** `event@scanner.edu`
- **Password:** `Event@123`
- **Scanner Location:** EVENT

## How It Works

### For Students/Faculty:
1. Students and faculty members have QR codes in their profiles
2. They scan their QR codes at any of the three scanner locations
3. Their attendance is recorded with the scanner location information

### For Scanner Admins:
1. **Login** with your scanner admin credentials
2. **Access Scanner** at `/scanner` page
   - The page will display which scanner location you're managing
   - Example: "Campus Scanner" for campus admin
3. **Scan QR Codes** from students/faculty
   - Point the camera at the student's QR code
   - Attendance is automatically recorded with your scanner location
4. **View Attendance** at `/admin` page
   - You can only see attendance records from YOUR scanner location
   - Records are color-coded:
     - 🔵 Blue = Campus
     - 🟣 Purple = Library
     - 🟢 Green = Event

### For Super Admins:
- Super admins (without a specific scanner location) can view ALL attendance records
- They can filter by scanner location if needed
- They can see which scanner admin scanned each attendance record

## Features

### Scanner Page (`/scanner`)
- Shows the scanner location name in the header
- Displays the admin name
- Color-coded chip showing scanner location
- Automatic recording of scanner location with each scan

### Admin Dashboard (`/admin`)
- Scanner admins see a banner showing their scanner location
- Attendance table includes a "Scanner" column with color-coded chips
- Scanner admins only see records from their scanner
- User table shows scanner location for scanner admins

### Database Fields
Each attendance record now includes:
- `scannedBy`: The admin user ID who scanned the QR code
- `scannerLocation`: The scanner location (campus/library/event)

Each user can have:
- `scannerLocation`: If set, this user is a scanner admin for that location

## Creating Additional Scanner Admins

If you need to create more scanner admins, run:

```bash
npm run seed:scanner-admins
```

Or manually create them by running the script:

```bash
npx tsx scripts/create-scanner-admins.ts
```

## API Changes

### POST `/api/attendance/scan`
- Now records `scannedBy` and `scannerLocation` automatically
- Returns scanner location in response

### GET `/api/admin/attendance`
- Automatically filters by scanner location for scanner admins
- Super admins can optionally filter with `?scannerLocation=campus|library|event`

### GET `/api/users/me`
- Now includes `scannerLocation` field in response

## Security

- Scanner admins can only access scanner and admin pages
- Regular users cannot access scanner functionality
- Scanner admins cannot see attendance from other scanners
- Only super admins can manage scanner admin accounts
- Scanner location is immutable (only set during account creation)

## Usage Example

1. **Campus Scanner Admin logs in:**
   ```
   Email: campus@scanner.edu
   Password: Campus@123
   ```

2. **Goes to Scanner page:**
   - Sees "Campus Scanner" header
   - Scans student QR codes
   - Each scan is tagged with "campus" location

3. **Views Admin Dashboard:**
   - Sees banner: "Scanner Location: CAMPUS"
   - Only sees attendance scanned at campus scanner
   - All records show "CAMPUS" badge in blue

## Testing

Test the system by:
1. Login as each scanner admin
2. Scan a test QR code at each scanner
3. Verify that attendance records show correct scanner location
4. Login as different scanner admin and verify they only see their records
5. Login as super admin and verify they see all records

## Notes

- Scanner locations are fixed: campus, library, event
- To add new scanner locations, update the type definitions in `src/lib/db.ts`
- Scanner admins cannot change their scanner location
- Each attendance scan is permanently linked to the scanner that recorded it
