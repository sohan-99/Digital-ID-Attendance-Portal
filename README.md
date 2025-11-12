# Digital ID & Attendance Portal for Pundra University

A modern full-stack web application for managing student digital IDs and tracking attendance using QR codes, built with Next.js.

## ✨ Features

- 🎓 Digital Student ID Cards with QR Codes
- 📱 QR Code-based Attendance Tracking
- 👨‍💼 Admin Dashboard with Real-time Analytics
- � **Scanner Admin System** - Dedicated scanner accounts for Campus, Library, and Event locations
- �📊 Department-wise Attendance Statistics
- 🔐 Secure JWT Authentication
- 📸 Profile Picture Upload
- 📈 Interactive Charts and Reports
- 📥 CSV Export Functionality
- 🏫 **Location-Based Access Control** - Scanner admins restricted to their assigned locations

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router) - Full-stack with built-in API routes
- **UI**: React 19, Material-UI, Tailwind CSS
- **Authentication**: JWT with bcrypt
- **Database**: File-based JSON (PostgreSQL/MySQL ready)
- **Language**: TypeScript

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # Backend API Routes (No separate server!)
│   │   ├── auth/        # Login, Register
│   │   ├── users/       # User management
│   │   ├── attendance/  # Attendance tracking
│   │   ├── admin/       # Admin operations
│   │   └── scanner/     # Scanner admin routes
│   ├── admin/           # Admin pages
│   ├── scanner-login/   # Scanner admin login
│   ├── scanner-dashboard/ # Scanner admin dashboard
│   ├── login/           # Login page
│   ├── profile/         # User profile
│   └── scanner/         # QR scanner
├── components/          # React components
├── lib/                 # Database & Auth utilities
└── scripts/             # Setup scripts
```

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```

**Login Credentials:**
- Admin: `admin@pundra.edu` / `Admin@123`
- Student: `alice@pundra.edu` / `Student@123`

### 2.5. Create Scanner Admin Accounts (Optional)
```bash
npm run create-scanner-admins
```

**Scanner Admin Credentials:**
- Campus: `campus_scanner` / `Campus@2025`
- Library: `library_scanner` / `Library@2025`
- Event: `event_scanner` / `Event@2025`

**Documentation:**
- See `SCANNER_ADMINS.md` for full scanner system documentation
- See `SCANNER_QUICK_START.md` for quick setup guide

### 3. Start Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📡 API Routes

All backend is integrated as Next.js API routes:

**Auth**: `/api/auth/login`, `/api/auth/register`  
**Users**: `/api/users/me`, `/api/users/:id/qrcode-token`  
**Attendance**: `/api/attendance/scan`  
**Admin**: `/api/admin/*` (users, stats, export)  
**Scanner Admin**: `/api/scanner/auth/login`, `/api/scanner/scan`, `/api/scanner/attendance`

## 🏫 Scanner Admin System

The Scanner Admin System allows dedicated scanner operators at three key locations:

### Features:
- **Location-Based Access**: Scanner admins can only scan at their assigned location
- **Real-time Tracking**: View attendance records specific to your location
- **Secure Authentication**: Separate login system with location verification
- **Audit Trail**: All scans record scanner admin ID and location

### Scanner Locations:
1. **Campus** (🏫) - General campus attendance
2. **Library** (📚) - Library entry tracking
3. **Event** (🎉) - Event attendance

### How to Use:
1. Create scanner admin accounts: `npm run create-scanner-admins`
2. Login at `/scanner-login` with location-specific credentials
3. Access scanner dashboard to view and record attendance
4. All scans are tagged with location and scanner admin ID

### Database Fields Added:
- `scannerAdmins` table with username, location, and credentials
- `attendance.scannedBy` - ID of scanner admin who recorded attendance
- `attendance.scannerLocation` - Location where scan occurred

For detailed documentation, see `SCANNER_ADMINS.md` and `SCANNER_QUICK_START.md`.

## 🔒 Security

- ✅ bcrypt password hashing
- ✅ JWT authentication
- ✅ Protected API routes
- ✅ Input validation
- ✅ Super admin protection

## 📝 License

MIT
