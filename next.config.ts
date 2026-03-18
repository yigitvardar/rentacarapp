import type { NextConfig } from "next";

const securityHeaders = [
  // Clickjacking engelleyelim - site iframe içinde gösterilemez
  { key: "X-Frame-Options", value: "DENY" },
  // MIME sniffing engelleyelim
  { key: "X-Content-Type-Options", value: "nosniff" },
  // XSS koruması (eski tarayıcılar için)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Referrer bilgisini sınırla
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HTTPS zorunlu kıl (HSTS) - 1 yıl
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Gereksiz browser API'lerini kapat
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), bluetooth=()",
  },
  // DNS prefetch kapat (bilgi sızıntısını önle)
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Admin sayfaları arama motorlarından gizle
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js hydration için unsafe-inline gerekli, nonce-based CSP gelişmiş aşama
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.iyzipay.com https://sandbox-static.iyzipay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // İyzico ödeme iframe/redirect
      "frame-src https://cpp.iyzipay.com https://sandbox-cpp.iyzipay.com",
      "connect-src 'self' https://api.iyzipay.com https://sandbox-api.iyzipay.com",
      "form-action 'self' https://cpp.iyzipay.com https://sandbox-cpp.iyzipay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    // Wildcard kaldırıldı — DoS vektörüydü
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  async headers() {
    return [
      {
        // Tüm sayfalara uygula
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Üretimde kaynak haritalarını gizle (hacker'lara kaynak kodu gösterme)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
