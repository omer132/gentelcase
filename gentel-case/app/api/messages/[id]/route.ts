import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the message
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(parseInt(params.id));

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the message
    db.prepare('UPDATE messages SET content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(
      content.trim(),
      parseInt(params.id)
    );

    const updatedMessage = db
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
      .get(parseInt(params.id));

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(parseInt(params.id));

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the message
    db.prepare('DELETE FROM messages WHERE id = ?').run(parseInt(params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}


