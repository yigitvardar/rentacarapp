/**
 * Sigorta API Servisi
 *
 * Gerçek entegrasyonda bu fonksiyon sigorta şirketinin REST API'sini çağırır.
 * Şu an için gerçekçi bir mock implementasyon kullanıyoruz.
 *
 * Gerçek entegrasyon için:
 * - INSURANCE_API_URL ve INSURANCE_API_KEY env variable'larını doldurun
 * - fetchRealInsurancePolicy() fonksiyonunu aktif edin
 */

import type { InsurancePolicyResponse } from "@/types";

// ============================================================
// MOCK VERİTABANI — Gerçek API gelene kadar test amaçlı
// TC numarasının son 2 hanesine göre farklı sonuçlar döner
// ============================================================
function getMockPolicy(tcNumber: string): InsurancePolicyResponse {
  const lastTwo = parseInt(tcNumber.slice(-2));

  // %60 aktif poliçe
  if (lastTwo <= 59) {
    const coverageTypes = [
      {
        type: "BASIC",
        label: "Temel Kasko",
        categories: ["Ekonomik"],
        maxDailyRate: 1000,
        maxDuration: 7,
        benefits: ["Trafik sigortası", "Temel hasar güvencesi"],
      },
      {
        type: "COMPREHENSIVE",
        label: "Tam Kasko",
        categories: ["Ekonomik", "Orta Sınıf"],
        maxDailyRate: 1500,
        maxDuration: 14,
        benefits: [
          "Trafik sigortası",
          "Tam kasko güvencesi",
          "Yol yardımı",
          "İkame araç",
        ],
      },
      {
        type: "PREMIUM",
        label: "Premium Kasko",
        categories: ["Ekonomik", "Orta Sınıf", "SUV", "Lüks"],
        maxDailyRate: 3000,
        maxDuration: 30,
        benefits: [
          "Trafik sigortası",
          "Tam kasko güvencesi",
          "Yol yardımı",
          "İkame araç",
          "Cam & Lastik güvencesi",
          "Sürücü kaza sigortası",
        ],
      },
    ];

    const coverage = coverageTypes[lastTwo % 3];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (lastTwo % 6) + 1);

    return {
      found: true,
      policyNumber: `POL-2024-${tcNumber.slice(-6)}`,
      policyStatus: "ACTIVE",
      holderName: "Poliçe Sahibi",
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      coverageType: coverage.type,
      coverageDetails: {
        vehicleCategories: coverage.categories,
        maxDailyRate: coverage.maxDailyRate,
        maxDuration: coverage.maxDuration,
        additionalBenefits: coverage.benefits,
      },
    };
  }

  // %20 süresi dolmuş poliçe
  if (lastTwo <= 79) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - (lastTwo % 3) - 1);

    return {
      found: true,
      policyNumber: `POL-2023-${tcNumber.slice(-6)}`,
      policyStatus: "EXPIRED",
      holderName: "Poliçe Sahibi",
      startDate: "2023-01-01",
      endDate: endDate.toISOString().split("T")[0],
      coverageType: "BASIC",
      coverageDetails: {
        vehicleCategories: ["Ekonomik"],
        maxDailyRate: 800,
        maxDuration: 7,
        additionalBenefits: [],
      },
    };
  }

  // %20 poliçe yok
  return {
    found: false,
    policyStatus: "NONE",
  };
}

// ============================================================
// ANA FONKSİYON — Gerçek veya Mock API
// ============================================================
export async function queryInsurancePolicy(
  tcNumber: string
): Promise<InsurancePolicyResponse> {
  const apiUrl = process.env.INSURANCE_API_URL;
  const apiKey = process.env.INSURANCE_API_KEY;

  // Gerçek API konfigüre edilmişse kullan
  if (
    apiUrl &&
    apiKey &&
    !apiUrl.includes("insurance-company.com") // placeholder değil
  ) {
    try {
      const response = await fetch(`${apiUrl}/policy/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ tcNumber }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Sigorta API hatası:", error);
      // API hatasında mock'a düş
    }
  }

  // Mock API — Geliştirme & test için
  // Gerçekçi gecikme simülasyonu
  await new Promise((r) => setTimeout(r, 800));
  return getMockPolicy(tcNumber);
}

// Kapsam tipini Türkçe etikete çevir
export const coverageTypeLabels: Record<string, string> = {
  BASIC: "Temel Kasko",
  COMPREHENSIVE: "Tam Kasko",
  PREMIUM: "Premium Kasko",
};

// Poliçe durumuna göre renk
export const policyStatusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  ACTIVE: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  EXPIRED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  SUSPENDED: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  NONE: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};
