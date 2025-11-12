'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface Message {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  username: string;
  userId: number;
  isAdmin: boolean;
}

interface ManagedUser {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormIsAdmin, setUserFormIsAdmin] = useState(false);
  const [userManagementError, setUserManagementError] = useState<string | null>(null);
  const [userManagementLoading, setUserManagementLoading] = useState(false);
  const [passwordResetUserId, setPasswordResetUserId] = useState<number | null>(null);
  const [passwordResetValue, setPasswordResetValue] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
    loadMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      const sorted = (data.messages || []).sort(
        (a: Message, b: Message) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMessages(sorted);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadUsers = useCallback(
    async (activeUser?: User | null) => {
      const effectiveUser = activeUser ?? user;
      if (!effectiveUser?.isAdmin) return;
      setUserManagementLoading(true);
      setUserManagementError(null);
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (response.ok) {
          setManagedUsers(data.users || []);
        } else {
          setUserManagementError(data.error || 'Kullanıcılar alınamadı');
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setUserManagementError('Kullanıcılar alınamadı');
      } finally {
        setUserManagementLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user?.isAdmin) {
      loadUsers(user);
    } else {
      setManagedUsers([]);
      setUserFormUsername('');
      setUserFormPassword('');
      setUserFormIsAdmin(false);
      setPasswordResetUserId(null);
      setPasswordResetValue('');
      setUserManagementError(null);
      setUserManagementLoading(false);
    }
  }, [user, loadUsers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        try {
          const meResponse = await fetch('/api/auth/me');
          const meData = await meResponse.json();
          if (meData.user) {
            setUser(meData.user);
            if (meData.user.isAdmin) {
              loadUsers(meData.user);
            }
          } else {
            setUser(null);
          }
        } catch (meError) {
          console.error('Failed to refresh user after login:', meError);
        }
      } else {
        alert(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.refresh();
      setManagedUsers([]);
      setNewTitle('');
      setNewMessage('');
      setUserFormUsername('');
      setUserFormPassword('');
      setUserFormIsAdmin(false);
      setUserManagementError(null);
      setPasswordResetUserId(null);
      setPasswordResetValue('');
      setUserManagementLoading(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      alert('Başlık ve mesaj zorunludur');
      return;
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newMessage }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [data.message, ...prev]);
        setNewTitle('');
        setNewMessage('');
        setExpandedMessageId(null);
        await loadMessages();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to post message:', error);
    }
  };

  const handleDelete = async (id: number) => {
    const messageId = Number(id);
    if (!Number.isFinite(messageId)) {
      alert('Mesaj bulunamadı');
      await loadMessages();
      return;
    }

    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Mesaj silinemedi');
        await loadMessages();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        setExpandedMessageId((current) => (current === messageId ? null : current));
        await loadMessages();
      } else if (data.error) {
        alert(data.error);
        await loadMessages();
      } else {
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      await loadMessages();
    }
  };

  const handleCreateManagedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    const trimmedUsername = userFormUsername.trim();
    if (trimmedUsername.length < 3) {
      setUserManagementError('Kullanıcı adı en az 3 karakter olmalı');
      return;
    }

    if (userFormPassword.length < 6) {
      setUserManagementError('Şifre en az 6 karakter olmalı');
      return;
    }

    setUserManagementLoading(true);
    setUserManagementError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password: userFormPassword,
          isAdmin: userFormIsAdmin,
        }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setManagedUsers((prev) => [data.user, ...prev.filter((u) => u.id !== data.user.id)]);
        setUserFormUsername('');
        setUserFormPassword('');
        setUserFormIsAdmin(false);
      } else {
        setUserManagementError(data.error || 'Kullanıcı oluşturulamadı');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setUserManagementError('Kullanıcı oluşturulamadı');
    } finally {
      setUserManagementLoading(false);
    }
  };

  const handleStartPasswordReset = (id: number) => {
    setPasswordResetUserId(id);
    setPasswordResetValue('');
    setUserManagementError(null);
  };

  const handleCancelPasswordReset = () => {
    setPasswordResetUserId(null);
    setPasswordResetValue('');
  };

  const handlePasswordReset = async () => {
    if (!user?.isAdmin || passwordResetUserId === null) return;

    if (passwordResetValue.length < 6) {
      setUserManagementError('Şifre en az 6 karakter olmalı');
      return;
    }

    setUserManagementLoading(true);
    setUserManagementError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: passwordResetUserId,
          password: passwordResetValue,
        }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setManagedUsers((prev) =>
          prev.map((existing) => (existing.id === data.user.id ? data.user : existing))
        );
        setPasswordResetUserId(null);
        setPasswordResetValue('');
      } else {
        setUserManagementError(data.error || 'Şifre güncellenemedi');
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      setUserManagementError('Şifre güncellenemedi');
    } finally {
      setUserManagementLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Mesajlaşma Sistemi</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Kullanıcı adınızı girin"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Şifrenizi girin"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Giriş Yap
            </button>
            <p className="text-sm text-gray-700 text-center mt-4">
              Giriş yapmak için yönetici tarafından oluşturulan kullanıcı adı ve şifreyi kullanın
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-800">Kullanıcı</p>
              <p className="font-semibold text-lg text-gray-900">{user.username}</p>
              {user.isAdmin && (
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Çıkış
            </button>
          </div>
        </div>

        {user.isAdmin && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
            <p className="text-sm text-gray-700 mt-1">
              Yeni kullanıcılar oluşturun ve mevcut kullanıcıların şifrelerini yönetin.
            </p>
            {userManagementError && (
              <p className="text-sm text-red-700 mt-3">{userManagementError}</p>
            )}
            <form
              onSubmit={handleCreateManagedUser}
              className="mt-5 grid gap-4 md:grid-cols-12 items-end"
            >
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={userFormUsername}
                  onChange={(e) => setUserFormUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="örn. ahmet"
                  required
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Şifre
                </label>
                <input
                  type="password"
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="En az 6 karakter"
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={userFormIsAdmin}
                    onChange={(e) => setUserFormIsAdmin(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Admin
                </label>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={userManagementLoading}
                >
                  {userManagementLoading ? 'Kaydediliyor...' : 'Kullanıcı Oluştur'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Mevcut Kullanıcılar</h3>
              {userManagementLoading && managedUsers.length === 0 ? (
                <p className="text-sm text-gray-700">Kullanıcılar yükleniyor...</p>
              ) : managedUsers.length === 0 ? (
                <p className="text-sm text-gray-700">Henüz kullanıcı oluşturulmadı.</p>
              ) : (
                <ul className="space-y-3">
                  {managedUsers.map((managedUser) => (
                    <li key={managedUser.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {managedUser.username}{' '}
                            {managedUser.isAdmin && (
                              <span className="text-xs text-red-600">(Admin)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-700">
                            Oluşturulma: {new Date(managedUser.createdAt).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          {passwordResetUserId === managedUser.id ? (
                            <>
                              <input
                                type="password"
                                value={passwordResetValue}
                                onChange={(e) => setPasswordResetValue(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                placeholder="Yeni şifre"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handlePasswordReset}
                                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                                  disabled={userManagementLoading}
                                >
                                  Kaydet
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelPasswordReset}
                                  className="px-3 py-2 bg-gray-200 text-gray-900 text-sm rounded-md hover:bg-gray-300 transition"
                                >
                                  İptal
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartPasswordReset(managedUser.id)}
                              className="px-3 py-2 text-sm text-blue-700 hover:text-blue-900 transition"
                            >
                              Şifre Sıfırla
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <form onSubmit={handleSubmitMessage} className="flex flex-col gap-3 text-gray-900">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Başlık"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={120}
            />
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
              rows={3}
            />
            <div className="flex items-center justify-between text-xs text-gray-700">
              <span>{newTitle.length}/120 başlık karakteri</span>
              <span>{newMessage.length}/1000 mesaj karakteri</span>
            </div>
            <button
              type="submit"
              className="self-end px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Gönder
            </button>
          </form>
        </div>

        {/* Messages List */}
        <div className="space-y-5">
          {messages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-700">
              Henüz mesaj yok. İlk mesajı siz yazın!
            </div>
          ) : (
            messages.map((message) => {
              const isExpanded = expandedMessageId === message.id;
              const previewLimit = 160;
              const firstLine = message.content.split(/\r?\n/)[0];
              const previewText = message.content.includes('\n')
                ? firstLine
                : message.content.slice(0, previewLimit);
              const isTruncated =
                message.content.includes('\n') || message.content.length > previewText.length;

              return (
                <div key={message.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 truncate">{message.title}</p>
                      <p className="font-semibold text-gray-800">
                        {message.username}
                        {message.isAdmin && (
                          <span className="ml-2 text-xs text-red-600">(Admin)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-700">{formatTime(message.createdAt)}</p>
                    </div>
                    {(message.userId === user.id || user.isAdmin) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </div>

                  <p
                    className={`text-gray-800 ${
                      isExpanded ? 'whitespace-pre-wrap' : 'truncate'
                    }`}
                  >
                    {isExpanded
                      ? message.content
                      : `${previewText}${isTruncated ? '…' : ''}`}
                  </p>

                  {isTruncated && (
                    <button
                      onClick={() =>
                        setExpandedMessageId((current) =>
                          current === message.id ? null : message.id
                        )
                      }
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? 'Kapat' : 'Detayları Göster'}
                    </button>
                  )}

                  {message.updatedAt && (
                    <p className="text-xs text-gray-400 mt-2">Düzenlendi</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}





