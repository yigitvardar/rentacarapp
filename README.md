<h1 align="center">🚗 Araç Kiralama Platformu</h1>

<p align="center">
  Modern, güvenli ve tam donanımlı bir araç kiralama yönetim sistemi.<br/>
  Kullanıcılar araç kiralayıp online ödeme yapabilir; yöneticiler tüm süreci tek panelden takip edebilir.
</p>

<p align="center">
  <a href="https://arac-kiralama-two.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐 Canlı Demo-arac--kiralama--two.vercel.app-black?style=for-the-badge" alt="Canlı Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=flat-square" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&style=flat-square" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&style=flat-square" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&style=flat-square" />
</p>

---

## ✨ Özellikler

### 👤 Kullanıcı Tarafı
- 🪪 TC kimlik doğrulama ve sigorta poliçe sorgulama
- 🚘 Araç kategorilerine göre filtreleme ve paket seçimi
- 🏷️ İndirim kodu destekli rezervasyon akışı ile canlı fiyat önizlemesi
- 💳 İyzico ile güvenli online ödeme (3D Secure)
- 📄 Ödeme sonrası kiralama belgesi görüntüleme ve yazdırma
- 🔧 Aktif kiralamalar için sorun / hasar bildirimi
- 👨‍💼 Profil yönetimi ve kiralama geçmişi

### 🛠️ Admin Paneli
- 📊 Gerçek zamanlı kiralama ve ödeme takibi
- 👥 Kullanıcı detay sayfası (kiralama geçmişi, toplam harcama)
- 🚗 Araç ve kategori yönetimi
- 🎟️ İndirim kodu oluşturma ve yönetimi
- 🔔 Sorun bildirimleri — okunmamış bildirim sayacı
- 🧾 Fatura ve ödeme kayıtları

### 🔒 Güvenlik
- 🛡️ Brute force koruması — 5 başarısız giriş → 15 dakika hesap kilidi
- ⏱️ DB tabanlı rate limiting (TC sorgulama, kayıt)
- 🔐 HTTP güvenlik başlıkları (CSP, HSTS, X-Frame-Options vb.)
- 🔗 Open redirect koruması
- 🕐 7 günlük oturum süresi
- 🗺️ Production'da kaynak haritası gizleme

---

## 🧱 Teknoloji Yığını

| Katman | Teknoloji |
|:---|:---|
| ⚡ Framework | Next.js 16 (App Router) |
| 🔷 Dil | TypeScript |
| 🗄️ Veritabanı | PostgreSQL (Supabase) |
| 🔌 ORM | Prisma |
| 🔑 Auth | NextAuth.js v5 (JWT) |
| 🎨 UI | Tailwind CSS + shadcn/ui |
| 💰 Ödeme | İyzico REST API |
| 📧 Email | Nodemailer |
| 🚀 Deploy | Vercel |

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL veritabanı (Supabase önerilir)
- İyzico hesabı (sandbox veya production)

### 1️⃣ Repoyu klonla

```bash
git clone https://github.com/yigitvardar/rentacarapp.git
cd rentacarapp
npm install
```

### 2️⃣ Ortam değişkenlerini ayarla

`.env.local` dosyası oluştur:

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

> `.env.example` dosyasını referans olarak kullanabilirsin.

### 3️⃣ Veritabanını oluştur ve seed et

```bash
npx prisma db push
npx prisma db seed
```

### 4️⃣ Geliştirme sunucusunu başlat

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışmaya başlayacak.

---

## 📁 Proje Yapısı

```
├── app/
│   ├── (dashboard)/        # 👤 Kullanıcı sayfaları (korumalı layout)
│   │   ├── dashboard/      #    Ana sayfa, aktif kiralamalar
│   │   ├── packages/       #    Paket listeleme ve araç seçimi
│   │   ├── payment/        #    Ödeme akışı (başarı / iptal)
│   │   ├── invoice/        #    Fatura sayfası
│   │   ├── policy/         #    Kiralama belgesi
│   │   └── profile/        #    Profil yönetimi
│   ├── admin/              # 🛠️  Admin paneli
│   │   ├── rentals/        #    Kiralama listesi
│   │   ├── users/          #    Kullanıcı yönetimi
│   │   ├── vehicles/       #    Araç yönetimi
│   │   ├── issues/         #    Sorun bildirimleri
│   │   └── discounts/      #    İndirim kodları
│   ├── api/
│   │   ├── payment/        # 💳 İyzico ödeme callback
│   │   └── cron/           # ⏰ Otomatik kiralama tamamlama
│   └── actions/            # ⚙️  Server Actions
├── components/
│   ├── auth/               # Giriş / kayıt bileşenleri
│   ├── booking/            # Rezervasyon formu
│   ├── admin/              # Admin UI bileşenleri
│   ├── dashboard/          # Kullanıcı dashboard bileşenleri
│   └── ui/                 # shadcn/ui temel bileşenler
├── lib/
│   ├── auth.ts             # NextAuth konfigürasyonu
│   ├── iyzico.ts           # İyzico API entegrasyonu
│   ├── rate-limit.ts       # DB tabanlı rate limiter
│   └── email.ts            # Email servisi
└── prisma/
    ├── schema.prisma        # Veritabanı şeması
    └── seed.ts              # Örnek veri
```

---

## 🗃️ Veritabanı Şeması

**Ana modeller:** `User` · `Vehicle` · `VehicleCategory` · `RentalPackage` · `Rental` · `Payment` · `DiscountCode` · `IssueReport` · `RateLimit`

**Kiralama durumları:**

```
PENDING → CONFIRMED → ACTIVE → COMPLETED
                   ↘ CANCELLED
```

---

## 📸 Ekran Görüntüleri

> Yakında eklenecek

---

## 📜 Lisans

MIT © [Yiğit Vardar](https://github.com/yigitvardar)
