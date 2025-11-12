# Scanner Admin System Documentation

## Overview

The Scanner Admin System is a dedicated subsystem designed to manage attendance scanning across three key locations: **Campus**, **Library**, and **Event**. Each location has its own dedicated scanner administrator account with restricted access to only their assigned location.

## System Architecture

### Scanner Locations

1. **Campus** - For general campus-wide attendance scanning
2. **Library** - For library entry/exit tracking
3. **Event** - For special events and activities

### User Roles

- **Scanner Admin**: Limited access account that can only:
  - Log in to their assigned location
  - Scan student QR codes
  - View attendance records for their location only
  - Cannot access admin dashboard or modify user data

## Scanner Admin Accounts

### Default Credentials

| Location | Username | Default Password | Purpose |
|----------|----------|-----------------|---------|
| Campus | `campus_scanner` | `Campus@2025` | Campus-wide attendance |
| Library | `library_scanner` | `Library@2025` | Library entry tracking |
| Event | `event_scanner` | `Event@2025` | Event attendance |

> ⚠️ **Security Note**: Change these passwords immediately after first login in production environments.

## Database Structure

### Scanner Admin Table

```typescript
interface ScannerAdmin {
  id: number;
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event';
  name: string;
  createdAt: string;
}
```

### Enhanced Attendance Records

```typescript
interface Attendance {
  id: number;
  userId: number;
  location: string | null;
  scannedAt: string;
  scannedBy?: number | null;        // Scanner admin ID
  scannerLocation?: string | null;   // Location where scan occurred
  user?: User;
}
```

## Access Control

### Location-Based Restrictions

- Scanner admins can only access their assigned location
- Cannot view or scan at other locations
- Cannot access administrative functions
- Cannot modify user data or system settings

### Session Management

- Each scanner admin has a unique JWT token
- Token includes location information
- API endpoints validate location access
- Sessions expire after 8 hours of inactivity

## API Endpoints

### Scanner Authentication

```
POST /api/scanner/auth/login
Body: { username: string, password: string }
Response: { token: string, scannerAdmin: ScannerAdmin }
```

### QR Code Scanning

```
POST /api/scanner/scan
Headers: Authorization: Bearer <scanner_token>
Body: { qrcodeToken: string }
Response: { success: boolean, user: User, attendance: Attendance }
```

### Location Attendance Records

```
GET /api/scanner/attendance
Headers: Authorization: Bearer <scanner_token>
Query: ?date=YYYY-MM-DD (optional)
Response: { records: Attendance[] }
```

## Security Features

### Authentication
- Bcrypt password hashing (10 rounds)
- JWT tokens with location claims
- Automatic session expiration

### Authorization
- Middleware validates scanner admin role
- Location-based access control
- Cannot escalate privileges

### Audit Trail
- All scans record scanner admin ID
- Timestamps for all operations
- Location tracking for accountability

## Setup Instructions

### 1. Create Scanner Admin Accounts

```bash
npm run create-scanner-admins
# or
npx tsx scripts/create-scanner-admins.ts
```

### 2. Verify Database

Check that `data/db.json` contains the `scannerAdmins` array with three accounts.

### 3. Test Login

Navigate to `/scanner-login` and test each account:
- Username: `campus_scanner`, Password: `Campus@2025`
- Username: `library_scanner`, Password: `Library@2025`
- Username: `event_scanner`, Password: `Event@2025`

### 4. Change Passwords (Production)

For production deployments, immediately change default passwords through the admin interface or database.

## Usage Workflow

### Scanner Admin Workflow

1. **Login** → Scanner admin logs in at `/scanner-login`
2. **Scan** → Opens camera or QR scanner interface
3. **Verify** → Student's QR code is scanned
4. **Record** → Attendance is logged with location and scanner ID
5. **View** → Can view all scans from their location

### Student Experience

1. Student generates QR code from profile
2. Presents QR code to scanner admin
3. Scanner admin scans the code
4. Attendance is instantly recorded
5. Student receives confirmation

## Troubleshooting

### Common Issues

**Issue**: Scanner admin cannot login
- Verify credentials match database
- Check that scanner admin account exists
- Ensure correct endpoint is being used

**Issue**: Cannot scan QR codes
- Verify camera permissions
- Check QR code validity
- Ensure student account is active

**Issue**: Location access denied
- Verify scanner admin is accessing correct location
- Check JWT token contains location claim
- Ensure no token expiration

### Logs and Monitoring

- All scanner operations are logged
- Check attendance table for `scannedBy` field
- Monitor `scannerLocation` field for location tracking
- Review timestamps for unusual patterns

## Best Practices

### For Administrators

1. Change default passwords immediately
2. Regularly audit scanner admin access
3. Monitor attendance patterns for anomalies
4. Back up database regularly
5. Review scanner admin activity logs

### For Scanner Admins

1. Never share login credentials
2. Always log out when leaving the station
3. Verify student identity before scanning
4. Report suspicious QR codes
5. Keep scanning device secure

## Integration Points

### With Main System

- Scanner admins are separate from regular admins
- Attendance records are shared with main system
- Reports include scanner location data
- Admin dashboard shows scanner activity

### With Student System

- Students generate QR codes from profile
- QR codes work across all scanner locations
- Attendance history shows scan locations
- Real-time updates to student records

## Maintenance

### Regular Tasks

- Weekly: Review scanner admin access logs
- Monthly: Audit attendance records by location
- Quarterly: Update scanner admin passwords
- Annually: Review and update location assignments

### Database Maintenance

```bash
# Backup database
cp data/db.json data/db.backup.$(date +%Y%m%d).json

# Clean old attendance records (optional)
# Implement based on retention policy
```

## Support

For issues or questions:
1. Check this documentation
2. Review SCANNER_QUICK_START.md
3. Contact system administrator
4. Check application logs

## Future Enhancements

- [ ] Mobile app for scanner admins
- [ ] Offline scanning capability
- [ ] Biometric verification
- [ ] Real-time dashboard updates
- [ ] Advanced analytics per location
- [ ] Multi-language support
- [ ] Bulk scanning mode
- [ ] Integration with student ID cards
