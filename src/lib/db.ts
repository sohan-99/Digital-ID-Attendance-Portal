import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean; // Deprecated: use role instead
  role?: 'super_admin' | 'admin' | 'user';
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

interface Attendance {
  id: number;
  userId: number;
  location: string | null;
  scannedAt: string;
  user?: User;
}

interface Database {
  users: User[];
  attendance: Attendance[];
  nextUserId: number;
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
    return JSON.parse(raw);
  } catch {
    return { users: [], attendance: [], nextUserId: 1, nextAttendanceId: 1 };
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
  role?: 'super_admin' | 'admin' | 'user';
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
  
  // Determine role: use provided role, or convert from isAdmin, or default to 'user'
  let userRole: 'super_admin' | 'admin' | 'user' = data.role || 'user';
  if (!data.role && data.isAdmin) {
    userRole = 'admin';
  }
  
  const user: User = {
    id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    isAdmin: !!data.isAdmin || userRole === 'super_admin' || userRole === 'admin',
    role: userRole,
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
  if (data.role !== undefined) {
    user.role = data.role;
    // Update isAdmin based on role
    user.isAdmin = data.role === 'super_admin' || data.role === 'admin';
  }
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
}): Attendance {
  const db = load();
  const id = db.nextAttendanceId++;
  const rec: Attendance = {
    id,
    userId: data.userId,
    location: data.location || null,
    scannedAt: (data.scannedAt || new Date()).toISOString(),
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

// Helper to get user role, with backward compatibility
export function getUserRole(user: User): 'super_admin' | 'admin' | 'user' {
  if (user.role) return user.role;
  // Backward compatibility: if no role field, check email or isAdmin
  if (user.email === 'admin@pundra.edu') return 'super_admin';
  if (user.isAdmin) return 'admin';
  return 'user';
}

// Helper to check if user is super admin
export function isSuperAdmin(user: User): boolean {
  return getUserRole(user) === 'super_admin';
}

// Helper to check if user is any kind of admin
export function isAnyAdmin(user: User): boolean {
  const role = getUserRole(user);
  return role === 'super_admin' || role === 'admin';
}
