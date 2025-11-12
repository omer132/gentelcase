import { cookies } from 'next/headers';
import * as db from './db';
import { hashPassword, verifyPassword } from './password';

export type User = Omit<db.User, 'passwordHash'>;

function sanitizeUser(user: db.User | null | undefined): User | null {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...publicFields } = user;
  return publicFields;
  }

async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function startSession(userId: number): Promise<User> {
  const sessionId = db.createSession(userId);
  await setSessionCookie(sessionId);
  const freshUser = db.getUserById(userId);
  const sanitized = sanitizeUser(freshUser);
  if (!sanitized) {
    throw new Error('Failed to start session: invalid user');
  }
  return sanitized;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = db.getUser(username);
  if (!user) return null;

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return sanitizeUser(user);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (!sessionId) return null;

  const session = db.getSession(sessionId);
  if (!session) return null;

  const user = db.getUserById(session.userId);
  return sanitizeUser(user);
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (sessionId) {
    db.deleteSession(sessionId);
  }

  cookieStore.delete('sessionId');
}

export function createUserAccount(
  username: string,
  password: string,
  isAdmin: boolean = false
): User {
  const passwordHash = hashPassword(password);
  const user = db.createUser(username, passwordHash, isAdmin);
  const sanitized = sanitizeUser(user);
  if (!sanitized) {
    throw new Error('Failed to create user');
  }
  return sanitized;
}

export function setUserPassword(userId: number, password: string): User | null {
  const passwordHash = hashPassword(password);
  const updated = db.updateUserPassword(userId, passwordHash);
  return sanitizeUser(updated);
}

export function listUsers(): User[] {
  return db
    .getUsers()
    .map((user) => sanitizeUser(user))
    .filter((user): user is User => Boolean(user));
}