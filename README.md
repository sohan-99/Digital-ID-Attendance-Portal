# Digital ID & Attendance Portal for Pundra University

A modern full-stack web application for managing student digital IDs and tracking attendance using QR codes, built with Next.js.

## ✨ Features

- 🎓 Digital Student ID Cards with QR Codes
- 📱 QR Code-based Attendance Tracking
- 👨‍💼 Admin Dashboard with Real-time Analytics
- 📊 Department-wise Attendance Statistics
- 🔐 Secure JWT Authentication
- 📸 Profile Picture Upload
- 📈 Interactive Charts and Reports
- 📥 CSV Export Functionality

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
│   │   └── admin/       # Admin operations
│   ├── admin/           # Admin pages
│   ├── login/           # Login page
│   ├── profile/         # User profile
│   └── scanner/         # QR scanner
├── components/          # React components
└── lib/                 # Database & Auth utilities
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

## 🔒 Security

- ✅ bcrypt password hashing
- ✅ JWT authentication
- ✅ Protected API routes
- ✅ Input validation
- ✅ Super admin protection

## 📝 License

MIT
