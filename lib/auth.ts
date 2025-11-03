import { cookies } from 'next/headers';
import * as db from './db';

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

export async function createSession(username: string, isAdmin: boolean = false) {
  // Check if user exists
  let user = db.getUser(username);

  if (!user) {
    // Create new user
    user = db.createUser(username, isAdmin);
  }

  // Create session
  const sessionId = db.createSession(user.id);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (!sessionId) return null;

  const session = db.getSession(sessionId);
  if (!session) return null;

  const user = db.getUserById(session.userId);
  return user || null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (sessionId) {
    db.deleteSession(sessionId);
  }

  cookieStore.delete('sessionId');
}