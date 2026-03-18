# Araç Kiralama Platformu

Modern ve güvenli bir araç kiralama yönetim sistemi. Kullanıcılar araç kiralayabilir, online ödeme yapabilir; yöneticiler tüm süreci tek panelden takip edebilir.

**Canlı Demo:** [arac-kiralama-two.vercel.app](https://arac-kiralama-two.vercel.app)

---

## Özellikler

### Kullanıcı Tarafı
- TC kimlik doğrulama ve sigorta poliçe sorgulama
- Araç kategorilerine göre filtreleme ve paket seçimi
- İndirim kodu destekli rezervasyon akışı
- İyzico ile güvenli online ödeme (3D Secure)
- Ödeme sonrası kiralama belgesi görüntüleme ve yazdırma
- Aktif kiralamalar için sorun/hasar bildirimi
- Profil yönetimi ve kiralama geçmişi

### Admin Paneli
- Gerçek zamanlı kiralama ve ödeme takibi
- Kullanıcı detay sayfası (kiralama geçmişi, harcama özeti)
- Araç ve kategori yönetimi
- İndirim kodu oluşturma ve yönetimi
- Sorun bildirimleri — okunmamış bildirim sayacı
- Fatura ve ödeme kayıtları

### Güvenlik
- Brute force koruması (5 başarısız giriş → 15 dk kilit)
- DB tabanlı rate limiting (TC sorgulama, kayıt)
- HTTP güvenlik başlıkları (CSP, HSTS, X-Frame-Options vb.)
- Open redirect koruması
- 7 günlük oturum süresi
- Production'da kaynak haritası gizleme

---

## Teknoloji

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript |
| Veritabanı | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (JWT) |
| UI | Tailwind CSS + shadcn/ui |
| Ödeme | İyzico REST API |
| Email | Nodemailer |
| Deploy | Vercel |

---

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL veritabanı (Supabase önerilir)
- İyzico hesabı (sandbox veya production)

### Adımlar

```bash
git clone https://github.com/yigitv/rental-app.git
cd rental-app
npm install
```

`.env` dosyası oluştur:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

IYZICO_API_KEY="..."
IYZICO_SECRET_KEY="..."
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"

SMTP_HOST="..."
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
ADMIN_EMAIL="..."

CRON_SECRET="..."
```

Veritabanını oluştur ve seed et:

```bash
npx prisma db push
npx prisma db seed
```

Geliştirme sunucusunu başlat:

```bash
npm run dev
```

---

## Proje Yapısı

```
├── app/
│   ├── (dashboard)/        # Kullanıcı sayfaları (layout korumalı)
│   │   ├── dashboard/      # Ana sayfa, aktif kiralamalar
│   │   ├── packages/       # Paket listeleme ve araç seçimi
│   │   ├── payment/        # Ödeme akışı (başarı / iptal)
│   │   ├── invoice/        # Fatura sayfası
│   │   ├── policy/         # Kiralama belgesi
│   │   └── profile/        # Profil yönetimi
│   ├── admin/              # Admin paneli
│   │   ├── rentals/        # Kiralama listesi
│   │   ├── users/          # Kullanıcı yönetimi
│   │   ├── vehicles/       # Araç yönetimi
│   │   ├── issues/         # Sorun bildirimleri
│   │   └── discounts/      # İndirim kodları
│   ├── api/
│   │   ├── payment/callback/   # İyzico ödeme callback
│   │   └── cron/               # Otomatik kiralama tamamlama
│   └── actions/            # Server Actions
├── components/
│   ├── auth/
│   ├── booking/
│   ├── admin/
│   ├── dashboard/
│   └── ui/                 # shadcn/ui bileşenleri
├── lib/
│   ├── auth.ts             # NextAuth konfigürasyonu
│   ├── iyzico.ts           # İyzico API entegrasyonu
│   ├── rate-limit.ts       # DB tabanlı rate limiter
│   └── email.ts            # Email servisi
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## Veritabanı Şeması

Ana modeller: `User`, `Vehicle`, `VehicleCategory`, `RentalPackage`, `Rental`, `Payment`, `DiscountCode`, `IssueReport`, `RateLimit`

Kiralama durumları: `PENDING → CONFIRMED → ACTIVE → COMPLETED` / `CANCELLED`

---

## Ekran Görüntüleri

> Yakında eklenecek

---

## Lisans

MIT
