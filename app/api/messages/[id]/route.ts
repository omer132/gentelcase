import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as db from '@/lib/db';

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
    const message = db.getMessageById(parseInt(params.id));

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the message
    db.updateMessage(parseInt(params.id), content.trim());
    const updatedMessage = db.getMessageById(parseInt(params.id));

    if (!updatedMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const userInfo = db.getUserById(updatedMessage.userId);

    return NextResponse.json({
      message: {
        id: updatedMessage.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message
    const message = db.getMessageById(parseInt(params.id));

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    if (message.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the message
    db.deleteMessage(parseInt(params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}