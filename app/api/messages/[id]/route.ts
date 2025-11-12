import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as db from '@/lib/db';

// Helper to support both direct params objects and promised params (Next.js v14+)
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
    const message = db.getMessageById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the message
    db.updateMessage(messageId, title.trim(), content.trim());
    const updatedMessage = db.getMessageById(messageId);

    if (!updatedMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const userInfo = db.getUserById(updatedMessage.userId);

    return NextResponse.json({
      message: {
        id: updatedMessage.id,
        title: updatedMessage.title,
        content: updatedMessage.content,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
        username: userInfo?.username || 'Unknown',
        userId: updatedMessage.userId,
        isAdmin: userInfo?.isAdmin || false,
      },
    });
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
    const message = db.getMessageById(messageId);

    if (!message) {
      // Message already gone; treat as success to keep deletion idempotent
      return NextResponse.json({ success: true });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the message
    db.deleteMessage(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}