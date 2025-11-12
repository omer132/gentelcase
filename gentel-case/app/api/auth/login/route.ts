import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    
    // Check for existing user
    const user = await createSession(trimmedUsername, trimmedUsername === 'admin');

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}










