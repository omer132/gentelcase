import { cookies } from 'next/headers';
import db from './db';

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

export async function createSession(username: string, isAdmin: boolean = false) {
  // Check if user exists
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user) {
    // Create new user
    const insert = db.prepare('INSERT INTO users (username, isAdmin) VALUES (?, ?)');
    const result = insert.run(username, isAdmin ? 1 : 0);
    user = {
      id: result.lastInsertRowid as number,
      username,
      isAdmin,
    };
  }

  // Create session
  const sessionId = Math.random().toString(36).substring(2, 15);
  db.prepare('INSERT OR REPLACE INTO sessions (id, userId) VALUES (?, ?)').run(sessionId, user.id);

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

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return null;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as User | undefined;
  return user || null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;

  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  cookieStore.delete('sessionId');
}


