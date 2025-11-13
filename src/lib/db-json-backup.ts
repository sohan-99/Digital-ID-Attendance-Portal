import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  profilePicture?: string | null;
  studentId?: string | null;
  program?: string | null;
  department?: string | null;
  batch?: string | null;
  session?: string | null;
  bloodGroup?: string | null;
  qrToken?: string | null;
  qrTokenExpiry?: string | null;
}

interface ScannerAdmin {
  id: number;
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event' | 'All';
  name: string;
  createdAt: string;
  isSuperAdmin?: boolean; // Super admin can access all locations
}

interface Attendance {
  id: number;
  userId: number;
  location: string | null;
  scannedAt: string;
  scannedBy?: number | null; // Scanner admin ID
  scannerLocation?: string | null; // Location where scan occurred
  user?: User;
}

interface Database {
  users: User[];
  scannerAdmins: ScannerAdmin[];
  attendance: Attendance[];
  nextUserId: number;
  nextScannerAdminId: number;
  nextAttendanceId: number;
}

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function load(): Database {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw);
    // Ensure scannerAdmins array exists for backward compatibility
    if (!data.scannerAdmins) {
      data.scannerAdmins = [];
    }
    if (!data.nextScannerAdminId) {
      data.nextScannerAdminId = 1;
    }
    return data;
  } catch {
    return { 
      users: [], 
      scannerAdmins: [],
      attendance: [], 
      nextUserId: 1, 
      nextScannerAdminId: 1,
      nextAttendanceId: 1 
    };
  }
}

function save(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function init(): Database {
  const db = load();
  save(db);
  return db;
}

export function addUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean;
  profilePicture?: string | null;
  studentId?: string | null;
  program?: string | null;
  department?: string | null;
  batch?: string | null;
  session?: string | null;
  bloodGroup?: string | null;
}): User {
  const db = load();
  const id = db.nextUserId++;
  const user: User = {
    id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    isAdmin: !!data.isAdmin,
    profilePicture: data.profilePicture || null,
    studentId: data.studentId || null,
    program: data.program || null,
    department: data.department || null,
    batch: data.batch || null,
    session: data.session || null,
    bloodGroup: data.bloodGroup || null,
  };
  db.users.push(user);
  save(db);
  return user;
}

export function updateUser(
  id: number,
  data: Partial<Omit<User, 'id'>>
): User | null {
  const db = load();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const user = db.users[idx];
  
  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.passwordHash !== undefined) user.passwordHash = data.passwordHash;
  if (data.isAdmin !== undefined) user.isAdmin = !!data.isAdmin;
  if (data.profilePicture !== undefined) user.profilePicture = data.profilePicture;
  if (data.studentId !== undefined) user.studentId = data.studentId;
  if (data.program !== undefined) user.program = data.program;
  if (data.department !== undefined) user.department = data.department;
  if (data.batch !== undefined) user.batch = data.batch;
  if (data.session !== undefined) user.session = data.session;
  if (data.bloodGroup !== undefined) user.bloodGroup = data.bloodGroup;
  if (data.qrToken !== undefined) user.qrToken = data.qrToken;
  if (data.qrTokenExpiry !== undefined) user.qrTokenExpiry = data.qrTokenExpiry;
  
  db.users[idx] = user;
  save(db);
  return user;
}

export function deleteUser(id: number): boolean {
  const db = load();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  db.users.splice(idx, 1);
  save(db);
  return true;
}

export function findUserByEmail(email: string): User | undefined {
  const db = load();
  return db.users.find((u) => u.email === email);
}

export function findUserById(id: number): User | undefined {
  const db = load();
  return db.users.find((u) => u.id === id);
}

export function allUsers(): User[] {
  return load().users;
}

export function addAttendance(data: {
  userId: number;
  location?: string | null;
  scannedAt?: Date;
  scannedBy?: number | null;
  scannerLocation?: string | null;
}): Attendance {
  const db = load();
  const id = db.nextAttendanceId++;
  const rec: Attendance = {
    id,
    userId: data.userId,
    location: data.location || null,
    scannedAt: (data.scannedAt || new Date()).toISOString(),
    scannedBy: data.scannedBy || null,
    scannerLocation: data.scannerLocation || null,
  };
  db.attendance.push(rec);
  save(db);
  return rec;
}

export function getAttendance(filter?: { userId?: number }): Attendance[] {
  const db = load();
  let rows = db.attendance.slice().reverse();
  if (filter?.userId) {
    rows = rows.filter((r) => r.userId === filter.userId);
  }
  // Join user data
  return rows.map((r) => ({
    ...r,
    user: db.users.find((u) => u.id === r.userId),
  }));
}

export function countUsers(): number {
  return load().users.length;
}

export function countAttendance(): number {
  return load().attendance.length;
}

export function recentCounts(days = 7): Array<{ day: string; cnt: number }> {
  const db = load();
  const map: Record<string, number> = {};
  
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }
  
  db.attendance.forEach((r) => {
    const day = r.scannedAt.slice(0, 10);
    if (map.hasOwnProperty(day)) map[day]++;
  });
  
  return Object.keys(map).map((day) => ({ day, cnt: map[day] }));
}

// Scanner Admin functions
export function addScannerAdmin(data: {
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event' | 'All';
  name: string;
  isSuperAdmin?: boolean;
}): ScannerAdmin {
  const db = load();
  const id = db.nextScannerAdminId++;
  const scannerAdmin: ScannerAdmin = {
    id,
    username: data.username,
    passwordHash: data.passwordHash,
    location: data.location,
    name: data.name,
    createdAt: new Date().toISOString(),
    isSuperAdmin: data.isSuperAdmin || false,
  };
  db.scannerAdmins.push(scannerAdmin);
  save(db);
  return scannerAdmin;
}

export function findScannerAdminByUsername(username: string): ScannerAdmin | undefined {
  const db = load();
  return db.scannerAdmins.find((s) => s.username === username);
}

export function findScannerAdminById(id: number): ScannerAdmin | undefined {
  const db = load();
  return db.scannerAdmins.find((s) => s.id === id);
}

export function allScannerAdmins(): ScannerAdmin[] {
  return load().scannerAdmins;
}

export function getAttendanceByLocation(location: string): Attendance[] {
  const db = load();
  const rows = db.attendance
    .filter((r) => r.scannerLocation === location)
    .slice()
    .reverse();
  
  // Join user data
  return rows.map((r) => ({
    ...r,
    user: db.users.find((u) => u.id === r.userId),
  }));
}

export function getTodayAttendanceByLocation(location: string): Attendance[] {
  const db = load();
  const today = new Date().toISOString().slice(0, 10);
  
  const rows = db.attendance
    .filter((r) => {
      const recordDate = r.scannedAt.slice(0, 10);
      return r.scannerLocation === location && recordDate === today;
    })
    .slice()
    .reverse();
  
  // Join user data
  return rows.map((r) => ({
    ...r,
    user: db.users.find((u) => u.id === r.userId),
  }));
}

export type { User, ScannerAdmin, Attendance, Database };
