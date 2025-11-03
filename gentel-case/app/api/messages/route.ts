import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const messages = db
      .prepare(
        `
        SELECT 
          m.id, 
          m.content, 
          m.createdAt, 
          m.updatedAt,
          u.username,
          u.id as userId,
          u.isAdmin
        FROM messages m
        JOIN users u ON m.userId = u.id
        ORDER BY m.createdAt DESC
        LIMIT 100
      `
      )
      .all();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    // Check rate limit - max 3 messages per minute
    const recentMessages = db
      .prepare(
        'SELECT COUNT(*) as count FROM messages WHERE userId = ? AND createdAt > datetime("now", "-1 minute")'
      )
      .get(user.id);

    if (recentMessages && (recentMessages as any).count >= 3) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const result = db.prepare('INSERT INTO messages (content, userId) VALUES (?, ?)').run(content.trim(), user.id);

    const newMessage = db
      .prepare(
        `
        SELECT 
          m.id, 
          m.content, 
          m.createdAt, 
          m.updatedAt,
          u.username,
          u.id as userId,
          u.isAdmin
        FROM messages m
        JOIN users u ON m.userId = u.id
        WHERE m.id = ?
      `
      )
      .get(result.lastInsertRowid);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}


