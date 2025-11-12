import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, startSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Kullanıcı adı gerekli' }, { status: 400 });
    }

    if (!password || password.length === 0) {
      return NextResponse.json({ error: 'Şifre gerekli' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    const user = await authenticateUser(trimmedUsername, password);

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }

    const sessionUser = await startSession(user.id);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş başarısız' }, { status: 500 });
  }
}