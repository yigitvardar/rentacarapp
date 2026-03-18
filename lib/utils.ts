import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui'nin standart cn helper'ı
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TC Kimlik numarası doğrulama (Türk Vatandaşlık Algoritması)
export function validateTcNumber(tc: string): boolean {
  if (!tc || tc.length !== 11) return false;
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === "0") return false;

  const digits = tc.split("").map(Number);

  // 10. hane kontrolü
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = (sumOdd * 7 - sumEven) % 10;
  if (d10 !== digits[9]) return false;

  // 11. hane kontrolü
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const d11 = sumFirst10 % 10;
  if (d11 !== digits[10]) return false;

  return true;
}

// TC numarasını maskele: 12345678901 → 123****901
export function maskTcNumber(tc: string): string {
  if (tc.length !== 11) return tc;
  return `${tc.slice(0, 3)}****${tc.slice(7)}`;
}

// Para formatı: 1250.50 → "1.250,50 ₺"
export function formatCurrency(
  amount: number | string,
  currency = "TRY"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

// Tarih formatı: Date → "17 Mart 2026"
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Tarih + saat formatı
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// İki tarih arasındaki gün farkı
export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Kiralama durumu Türkçe etiketleri
export const rentalStatusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onay Bekleniyor",
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
};

// Poliçe durumu Türkçe etiketleri
export const policyStatusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  EXPIRED: "Süresi Dolmuş",
  SUSPENDED: "Askıya Alınmış",
  NONE: "Poliçe Yok",
};
