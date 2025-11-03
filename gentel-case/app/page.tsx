'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  username: string;
  userId: number;
  isAdmin: boolean;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

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
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        alert('Giriş başarısız');
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
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages([data.message, ...messages]);
        setNewMessage('');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to post message:', error);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages(messages.map((m) => (m.id === id ? data.message : m)));
        setEditingMessage(null);
        setEditContent('');
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setMessages(messages.filter((m) => m.id !== id));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
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
          <h1 className="text-2xl font-bold text-center mb-6">Mesajlaşma Sistemi</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Kullanıcı adınızı girin"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Giriş Yap
            </button>
            <p className="text-sm text-gray-500 text-center mt-4">
              Demo için herhangi bir kullanıcı adı ile giriş yapabilirsiniz
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Kullanıcı</p>
              <p className="font-semibold text-lg">{user.username}</p>
              {user.isAdmin && (
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Çıkış
            </button>
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleSubmitMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Gönder
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/1000 karakter
          </p>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              Henüz mesaj yok. İlk mesajı siz yazın!
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {message.username}
                      {message.isAdmin && (
                        <span className="ml-2 text-xs text-red-600">(Admin)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{formatTime(message.createdAt)}</p>
                  </div>
                  {(message.userId === user.id || user.isAdmin) && (
                    <div className="flex gap-2">
                      {message.userId === user.id && (
                        <button
                          onClick={() => {
                            setEditingMessage(message.id);
                            setEditContent(message.content);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Düzenle
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </div>
                
                {editingMessage === message.id ? (
                  <div className="mt-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(message.id)}
                        className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                        className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                )}
                
                {message.updatedAt && (
                  <p className="text-xs text-gray-400 mt-2">Düzenlendi</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}