import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createUserAccount, listUsers, setUserPassword } from '@/lib/auth';
import * as db from '@/lib/db';

function sanitizeResponseUser(user: Awaited<ReturnType<typeof createUserAccount>> | null) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

async function ensureAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.isAdmin) {
    return null;
  }
  return currentUser;
}

export async function GET() {
  try {
    const admin = await ensureAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const users = listUsers().map((user) => ({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Kullanıcılar alınamadı' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await ensureAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const { username, password, isAdmin = false } = await request.json();

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json({ error: 'Kullanıcı adı en az 3 karakter olmalı' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }

    const trimmedUsername = username.trim();

    if (db.getUser(trimmedUsername)) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 409 });
    }

    const created = createUserAccount(trimmedUsername, password, Boolean(isAdmin));

    return NextResponse.json(
      { success: true, user: sanitizeResponseUser(created) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Kullanıcı oluşturulamadı' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await ensureAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const { userId, password } = await request.json();

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }

    if (!db.getUserById(userId)) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const updated = setUserPassword(userId, password);

    return NextResponse.json({ success: true, user: sanitizeResponseUser(updated) });
  } catch (error) {
    console.error('Update user password error:', error);
    return NextResponse.json({ error: 'Şifre güncellenemedi' }, { status: 500 });
  }
}

