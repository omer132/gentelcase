import path from 'path';
import fs from 'fs';
import { hashPassword } from './password';

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Session {
  id: string;
  userId: number;
  createdAt: string;
}

interface Message {
  id: number;
  title: string;
  content: string;
  userId: number;
  createdAt: string;
  updatedAt: string | null;
}

interface Database {
  users: User[];
  sessions: Session[];
  messages: Message[];
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');
const dbDir = path.dirname(dbPath);

// Initialize database
function initDb(): Database {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const db: Database = {
      users: [
        {
          id: 1,
          username: 'admin',
          passwordHash: hashPassword('admin123'),
          isAdmin: true,
          createdAt: new Date().toISOString(),
        },
      ],
      sessions: [],
      messages: [],
    };
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return db;
  }

  const existingDb = JSON.parse(fs.readFileSync(dbPath, 'utf8')) as Database;
  let shouldPersist = false;

  for (const user of existingDb.users) {
    if (typeof user.passwordHash !== 'string') {
      user.passwordHash = '';
      shouldPersist = true;
    }
  }

  let adminUser = existingDb.users.find((u) => u.username === 'admin');

  if (!adminUser) {
    const nextId = existingDb.users.length
      ? Math.max(...existingDb.users.map((u) => u.id)) + 1
      : 1;
    adminUser = {
      id: nextId,
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      isAdmin: true,
      createdAt: new Date().toISOString(),
    };
    existingDb.users.push(adminUser);
    shouldPersist = true;
  } else if (!adminUser.passwordHash) {
    adminUser.passwordHash = hashPassword('admin123');
    shouldPersist = true;
  }

  if (shouldPersist) {
    fs.writeFileSync(dbPath, JSON.stringify(existingDb, null, 2));
  }

  return existingDb;
}

let db = initDb();

// Auto-increment IDs
function getNextUserId(): number {
  return Math.max(...db.users.map((u) => u.id), 0) + 1;
}

function getNextMessageId(): number {
  return Math.max(...db.messages.map((m) => m.id), 0) + 1;
}

// Database operations
export function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function getUser(username: string): User | undefined {
  return db.users.find((u) => u.username === username);
}

export function getUserById(id: number): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function createUser(username: string, passwordHash: string, isAdmin: boolean): User {
  const user: User = {
    id: getNextUserId(),
    username,
    passwordHash,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDb();
  return user;
}

export function getUsers(): User[] {
  return db.users.slice();
}

export function updateUserPassword(id: number, passwordHash: string): User | undefined {
  const user = getUserById(id);
  if (!user) return undefined;
  user.passwordHash = passwordHash;
  saveDb();
  return user;
}

export function getSession(sessionId: string): Session | undefined {
  return db.sessions.find((s) => s.id === sessionId);
}

export function createSession(userId: number): string {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
  };
  db.sessions.push(session);
  saveDb();
  return sessionId;
}

export function deleteSession(sessionId: string) {
  db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  saveDb();
}

export function getAllMessages() {
  return db.messages.map((msg) => {
    const user = getUserById(msg.userId);
    return {
      ...msg,
      username: user?.username || 'Unknown',
      isAdmin: user?.isAdmin || false,
      userId: msg.userId,
    };
  });
}

export function createMessage(userId: number, title: string, content: string) {
  const message: Message = {
    id: getNextMessageId(),
    title,
    content,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  db.messages.push(message);
  saveDb();
  return message;
}

export function getMessageById(id: number): Message | undefined {
  return db.messages.find((m) => m.id === id);
}

export function updateMessage(id: number, title: string, content: string) {
  const message = getMessageById(id);
  if (message) {
    message.title = title;
    message.content = content;
    message.updatedAt = new Date().toISOString();
    saveDb();
  }
  return message;
}

export function deleteMessage(id: number) {
  db.messages = db.messages.filter((m) => m.id !== id);
  saveDb();
}

export function getUserMessageCount(userId: number, since: Date): number {
  return db.messages.filter((m) => {
    if (m.userId !== userId) return false;
    const msgDate = new Date(m.createdAt);
    return msgDate > since;
  }).length;
}

export default db;