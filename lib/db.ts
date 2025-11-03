import path from 'path';
import fs from 'fs';

interface User {
  id: number;
  username: string;
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
      users: [{ id: 1, username: 'admin', isAdmin: true, createdAt: new Date().toISOString() }],
      sessions: [],
      messages: [],
    };
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return db;
  }

  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
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

export function createUser(username: string, isAdmin: boolean): User {
  const user: User = {
    id: getNextUserId(),
    username,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
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

export function createMessage(userId: number, content: string) {
  const message: Message = {
    id: getNextMessageId(),
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

export function updateMessage(id: number, content: string) {
  const message = getMessageById(id);
  if (message) {
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