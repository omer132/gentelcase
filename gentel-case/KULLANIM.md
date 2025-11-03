# Kullanım Rehberi

## Başlatma

Projeyi başlatmak için `gentel-case` klasörüne gidin ve aşağıdaki komutu çalıştırın:

```bash
cd gentel-case
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Özellikler

### 1. Giriş Sistemi
- Herhangi bir kullanıcı adı ile giriş yapabilirsiniz
- Kullanıcı adı "admin" olan kullanıcı otomatik olarak admin yetkisi alır
- Giriş yaptıktan sonra oturum 7 gün boyunca saklanır

### 2. Mesaj Gönderme
- En fazla 1000 karakter içeren mesajlar gönderebilirsiniz
- Mesajlar tüm kullanıcılar tarafından görülebilir
- Dakikada en fazla 3 mesaj gönderebilirsiniz (rate limiting)
- En yeni mesajlar en üstte görünür

### 3. Mesaj Düzenleme
- Sadece kendi mesajlarınızı düzenleyebilirsiniz
- "Düzenle" butonuna tıklayarak mesajınızı düzenleyebilirsiniz
- Düzenlenen mesajlar "Düzenlendi" etiketi ile işaretlenir

### 4. Mesaj Silme
- Sadece kendi mesajlarınızı silebilirsiniz
- Admin kullanıcılar herhangi bir mesajı silebilir
- Silme işlemi onay gerektirir

### 5. Gerçek Zamanlı Güncelleme
- Mesajlar her 5 saniyede bir otomatik olarak yenilenir
- Sayfa yenilemeden yeni mesajlar görünür
- Başka kullanıcıların mesajlarını anında görebilirsiniz

## Demo Kullanıcıları

Aşağıdaki kullanıcı adlarıyla giriş yapabilirsiniz:

1. **Normal Kullanıcı**: Herhangi bir isim (örn: "ahmet", "ayse", "mehmet")
2. **Admin Kullanıcı**: "admin" (tüm mesajları silebilir)

## Veritabanı

SQLite veritabanı otomatik olarak oluşturulur ve `data/messages.db` konumunda saklanır.

Tablolar:
- `users`: Kullanıcı bilgileri
- `sessions`: Oturum bilgileri  
- `messages`: Mesajlar

## Güvenlik

- Sadece giriş yapmış kullanıcılar mesaj gönderebilir
- XSS saldırılarına karşı mesaj içerikleri temizlenir
- Rate limiting sayesinde spam engellenir
- Kullanıcılar sadece kendi mesajlarını düzenleyebilir/silebilir
- Admin kullanıcılar herhangi bir mesajı moderasyon amaçlı silebilir

## Sorun Giderme

### Veritabanı Hatası
Eğer veritabanı hatası alırsanız, `data` klasörünü silip tekrar deneyin:

```bash
rm -rf data
npm run dev
```

### Port Hatası
Eğer 3000 portu kullanılıyorsa, farklı bir port kullanabilirsiniz:

```bash
PORT=3001 npm run dev
```

### Bağımlılık Hatası
Eğer bağımlılık hataları alırsanız:

```bash
rm -rf node_modules package-lock.json
npm install
```


