import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

// Helper to safely extract the id whether params is a plain object or a Promise
async function getMessageId(params: { id: string } | Promise<{ id: string }>): Promise<number> {
  const value =
    typeof (params as Promise<{ id: string }>).then === 'function'
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string });
  const id = Number.parseInt(value?.id ?? '', 10);
  if (!Number.isFinite(id)) {
    return Number.NaN;
  }
  return id;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const messageId = await getMessageId(params);
  if (!Number.isFinite(messageId)) {
    return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content } = await request.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.trim().length > 120) {
      return NextResponse.json({ error: 'Title too long (max 120 characters)' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    // Get the message
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the message
    db.prepare('UPDATE messages SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(
      title.trim(),
      content.trim(),
      messageId
    );

    const updatedMessage = db
      .prepare(
        `
        SELECT 
          m.id, 
          m.title,
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
      .get(messageId);

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const messageId = await getMessageId(params);
  if (!Number.isFinite(messageId)) {
    console.warn('Delete message warning: invalid id');
    return NextResponse.json({ success: true });
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);

    if (!message) {
      // Already deleted; behave idempotently
      return NextResponse.json({ success: true });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the message
    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}





