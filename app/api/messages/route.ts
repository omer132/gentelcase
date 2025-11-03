import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as db from '@/lib/db';

export async function GET() {
  try {
    const messages = db.getAllMessages().slice(0, 100);
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
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentCount = db.getUserMessageCount(user.id, oneMinuteAgo);

    if (recentCount >= 3) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const message = db.createMessage(user.id, content.trim());
    const userInfo = db.getUserById(user.id);

    const newMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      username: userInfo?.username || 'Unknown',
      userId: message.userId,
      isAdmin: userInfo?.isAdmin || false,
    };

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}