import { getDatabase, COLLECTIONS } from './mongodb';
import { ObjectId } from 'mongodb';

interface User {
  _id?: ObjectId;
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
  _id?: ObjectId;
  id: number;
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event' | 'All';
  name: string;
  createdAt: string;
  isSuperAdmin?: boolean;
}

interface Attendance {
  _id?: ObjectId;
  id: number;
  userId: number;
  location: string | null;
  scannedAt: string;
  scannedBy?: number | null;
  scannerLocation?: string | null;
  user?: User;
}

interface Counter {
  _id: string;
  seq: number;
}

// Helper function to get next ID
async function getNextSequence(sequenceName: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.collection<Counter>(COLLECTIONS.COUNTERS).findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result?.seq || 1;
}

// Initialize database
export async function init(): Promise<void> {
  const db = await getDatabase();
  
  // Create indexes
  await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });
  await db.collection(COLLECTIONS.USERS).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.SCANNER_ADMINS).createIndex({ username: 1 }, { unique: true });
  await db.collection(COLLECTIONS.SCANNER_ADMINS).createIndex({ id: 1 }, { unique: true });
  await db.collection(COLLECTIONS.ATTENDANCE).createIndex({ userId: 1 });
  await db.collection(COLLECTIONS.ATTENDANCE).createIndex({ scannedAt: -1 });
  await db.collection(COLLECTIONS.ATTENDANCE).createIndex({ scannerLocation: 1 });
}

// User functions
export async function addUser(data: {
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
}): Promise<User> {
  const db = await getDatabase();
  const id = await getNextSequence('userId');
  
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
  
  await db.collection<User>(COLLECTIONS.USERS).insertOne(user);
  return user;
}

export async function updateUser(
  id: number,
  data: Partial<Omit<User, 'id'>>
): Promise<User | null> {
  const db = await getDatabase();
  const updateData: Partial<User> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
  if (data.isAdmin !== undefined) updateData.isAdmin = !!data.isAdmin;
  if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
  if (data.studentId !== undefined) updateData.studentId = data.studentId;
  if (data.program !== undefined) updateData.program = data.program;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.batch !== undefined) updateData.batch = data.batch;
  if (data.session !== undefined) updateData.session = data.session;
  if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
  if (data.qrToken !== undefined) updateData.qrToken = data.qrToken;
  if (data.qrTokenExpiry !== undefined) updateData.qrTokenExpiry = data.qrTokenExpiry;
  
  const result = await db.collection<User>(COLLECTIONS.USERS).findOneAndUpdate(
    { id },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

export async function deleteUser(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<User>(COLLECTIONS.USERS).deleteOne({ id });
  return result.deletedCount > 0;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDatabase();
  const user = await db.collection<User>(COLLECTIONS.USERS).findOne({ email });
  return user || undefined;
}

export async function findUserById(id: number): Promise<User | undefined> {
  const db = await getDatabase();
  const user = await db.collection<User>(COLLECTIONS.USERS).findOne({ id });
  return user || undefined;
}

export async function allUsers(): Promise<User[]> {
  const db = await getDatabase();
  return await db.collection<User>(COLLECTIONS.USERS).find({}).toArray();
}

// Attendance functions
export async function addAttendance(data: {
  userId: number;
  location?: string | null;
  scannedAt?: Date;
  scannedBy?: number | null;
  scannerLocation?: string | null;
}): Promise<Attendance> {
  const db = await getDatabase();
  const id = await getNextSequence('attendanceId');
  
  const rec: Attendance = {
    id,
    userId: data.userId,
    location: data.location || null,
    scannedAt: (data.scannedAt || new Date()).toISOString(),
    scannedBy: data.scannedBy || null,
    scannerLocation: data.scannerLocation || null,
  };
  
  await db.collection<Attendance>(COLLECTIONS.ATTENDANCE).insertOne(rec);
  return rec;
}

export async function getAttendance(filter?: { userId?: number }): Promise<Attendance[]> {
  const db = await getDatabase();
  const query: any = {};
  
  if (filter?.userId) {
    query.userId = filter.userId;
  }
  
  const records = await db.collection<Attendance>(COLLECTIONS.ATTENDANCE)
    .find(query)
    .sort({ scannedAt: -1 })
    .toArray();
  
  // Join user data
  const users = await db.collection<User>(COLLECTIONS.USERS).find({}).toArray();
  const userMap = new Map(users.map(u => [u.id, u]));
  
  return records.map(r => ({
    ...r,
    user: userMap.get(r.userId),
  }));
}

export async function countUsers(): Promise<number> {
  const db = await getDatabase();
  return await db.collection(COLLECTIONS.USERS).countDocuments();
}

export async function countAttendance(): Promise<number> {
  const db = await getDatabase();
  return await db.collection(COLLECTIONS.ATTENDANCE).countDocuments();
}

export async function recentCounts(days = 7): Promise<Array<{ day: string; cnt: number }>> {
  const db = await getDatabase();
  const map: Record<string, number> = {};
  
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }
  
  const records = await db.collection<Attendance>(COLLECTIONS.ATTENDANCE).find({}).toArray();
  
  records.forEach((r) => {
    const day = r.scannedAt.slice(0, 10);
    if (map.hasOwnProperty(day)) map[day]++;
  });
  
  return Object.keys(map).map((day) => ({ day, cnt: map[day] }));
}

// Scanner Admin functions
export async function addScannerAdmin(data: {
  username: string;
  passwordHash: string;
  location: 'Campus' | 'Library' | 'Event' | 'All';
  name: string;
  isSuperAdmin?: boolean;
}): Promise<ScannerAdmin> {
  const db = await getDatabase();
  const id = await getNextSequence('scannerAdminId');
  
  const scannerAdmin: ScannerAdmin = {
    id,
    username: data.username,
    passwordHash: data.passwordHash,
    location: data.location,
    name: data.name,
    createdAt: new Date().toISOString(),
    isSuperAdmin: data.isSuperAdmin || false,
  };
  
  await db.collection<ScannerAdmin>(COLLECTIONS.SCANNER_ADMINS).insertOne(scannerAdmin);
  return scannerAdmin;
}

export async function findScannerAdminByUsername(username: string): Promise<ScannerAdmin | undefined> {
  const db = await getDatabase();
  const admin = await db.collection<ScannerAdmin>(COLLECTIONS.SCANNER_ADMINS).findOne({ username });
  return admin || undefined;
}

export async function findScannerAdminById(id: number): Promise<ScannerAdmin | undefined> {
  const db = await getDatabase();
  const admin = await db.collection<ScannerAdmin>(COLLECTIONS.SCANNER_ADMINS).findOne({ id });
  return admin || undefined;
}

export async function allScannerAdmins(): Promise<ScannerAdmin[]> {
  const db = await getDatabase();
  return await db.collection<ScannerAdmin>(COLLECTIONS.SCANNER_ADMINS).find({}).toArray();
}

export async function getAttendanceByLocation(location: string): Promise<Attendance[]> {
  const db = await getDatabase();
  const records = await db.collection<Attendance>(COLLECTIONS.ATTENDANCE)
    .find({ scannerLocation: location })
    .sort({ scannedAt: -1 })
    .toArray();
  
  // Join user data
  const users = await db.collection<User>(COLLECTIONS.USERS).find({}).toArray();
  const userMap = new Map(users.map(u => [u.id, u]));
  
  return records.map(r => ({
    ...r,
    user: userMap.get(r.userId),
  }));
}

export async function getTodayAttendanceByLocation(location: string): Promise<Attendance[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  
  const records = await db.collection<Attendance>(COLLECTIONS.ATTENDANCE)
    .find({ scannerLocation: location })
    .sort({ scannedAt: -1 })
    .toArray();
  
  const todayRecords = records.filter(r => {
    const recordDate = r.scannedAt.slice(0, 10);
    return recordDate === today;
  });
  
  // Join user data
  const users = await db.collection<User>(COLLECTIONS.USERS).find({}).toArray();
  const userMap = new Map(users.map(u => [u.id, u]));
  
  return todayRecords.map(r => ({
    ...r,
    user: userMap.get(r.userId),
  }));
}

export type { User, ScannerAdmin, Attendance };
