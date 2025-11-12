# Mesajlaşma Sistemi

Next.js ile geliştirilmiş basit bir mesajlaşma/duyuru sistemi. Kullanıcılar giriş yaparak mesaj paylaşabilir, düzenleyebilir ve silebilir.

## Özellikler

- ✅ Kullanıcı giriş sistemi
- ✅ Mesaj gönderme (1-1000 karakter)
- ✅ Mesaj düzenleme ve silme
- ✅ Admin moderasyon yetkileri
- ✅ Gerçek zamanlı mesaj güncelleme (5 saniye polling)
- ✅ Rate limiting (dakikada max 3 mesaj)
- ✅ SQLite veritabanı
- ✅ Modern ve responsive UI

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Kullanım

1. **Giriş Yap**: Herhangi bir kullanıcı adı ile giriş yapabilirsiniz
2. **Mesaj Gönder**: En fazla 1000 karakter içeren mesajlar paylaşabilirsiniz
3. **Mesajları Düzenle**: Kendi mesajlarınızı düzenleyebilirsiniz
4. **Mesajları Sil**: Kendi mesajlarınızı silebilirsiniz
5. **Admin Yetkisi**: "admin" kullanıcı adı ile giriş yaparak herhangi bir mesajı silebilirsiniz

## Teknolojiler

- **Next.js 16** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Stil sistemi
- **SQLite** - Veritabanı
- **better-sqlite3** - Veritabanı bağlantı kütüphanesi

## Veritabanı

SQLite veritabanı otomatik olarak oluşturulur. Veritabanı dosyası `data/messages.db` konumunda saklanır.

### Tablolar

- **users**: Kullanıcı bilgileri
- **sessions**: Oturum bilgileri
- **messages**: Mesajlar

## API Endpoints

### Kimlik Doğrulama

- `POST /api/auth/login` - Giriş yap
- `POST /api/auth/logout` - Çıkış yap
- `GET /api/auth/me` - Aktif kullanıcı bilgisi

### Mesajlar

- `GET /api/messages` - Tüm mesajları getir
- `POST /api/messages` - Yeni mesaj gönder
- `PUT /api/messages/[id]` - Mesaj güncelle
- `DELETE /api/messages/[id]` - Mesaj sil

## Güvenlik

- Sadece giriş yapmış kullanıcılar mesaj gönderebilir
- Rate limiting: Dakikada en fazla 3 mesaj
- Kullanıcılar sadece kendi mesajlarını düzenleyebilir/silebilir
- Admin kullanıcılar herhangi bir mesajı silebilir
- XSS koruması için mesaj içerikleri temizlenir

## Lisans

MIT










