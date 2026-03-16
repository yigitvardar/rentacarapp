/**
 * İyzico Ödeme Servisi — Doğrudan REST API implementasyonu
 * iyzipay npm paketini kullanmaz, Node.js crypto ile imza hesaplar.
 *
 * Test kartları: https://docs.iyzico.com/sandbox/test-cards
 * Başarılı: 4506 3490 0000 0006
 * Başarısız: 4508 0348 1005 0003
 * Son kullanma: Herhangi gelecek tarih | CVV: 000 | 3D: a
 */

import crypto from "crypto";

function getConfig() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl =
    process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    throw new Error("İyzico API anahtarları tanımlı değil");
  }

  return { apiKey, secretKey, baseUrl };
}

// İyzico HMAC-SHA256 imza hesaplama
function computeSignature(
  secretKey: string,
  randomString: string,
  requestBody: string
): string {
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(randomString + requestBody)
    .digest("base64");
  return hash;
}

// Tutarı İyzico formatına çevir
function toAmount(n: number): string {
  return n.toFixed(2);
}

// ============================================================
// CHECKOUT FORM OLUŞTUR
// ============================================================

export interface CheckoutFormRequest {
  conversationId: string;
  rentalId: string;
  price: number;
  paidPrice: number;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    ip: string;
    city: string;
    country: string;
  };
  basketDescription: string;
}

export interface CheckoutFormResult {
  success: boolean;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  token?: string;
  error?: string;
}

export async function createCheckoutForm(
  req: CheckoutFormRequest
): Promise<CheckoutFormResult> {
  const { apiKey, secretKey, baseUrl } = getConfig();

  const randomString = Math.random().toString(36).substring(2);
  const locale = "tr";

  const body = {
    locale,
    conversationId: req.conversationId,
    price: toAmount(req.price),
    paidPrice: toAmount(req.paidPrice),
    currency: "TRY",
    basketId: req.rentalId,
    paymentGroup: "PRODUCT",
    callbackUrl: req.callbackUrl,
    enabledInstallments: [1, 2, 3, 6],
    buyer: {
      id: req.buyer.id,
      name: req.buyer.name,
      surname: req.buyer.surname,
      gsmNumber: "+905000000000",
      email: req.buyer.email,
      identityNumber: "11111111111",
      lastLoginDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      registrationDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      registrationAddress: "Istanbul, Turkey",
      ip: req.buyer.ip,
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: `${req.buyer.name} ${req.buyer.surname}`,
      city: "Istanbul",
      country: "Turkey",
      address: "Istanbul, Turkey",
      zipCode: "34000",
    },
    billingAddress: {
      contactName: `${req.buyer.name} ${req.buyer.surname}`,
      city: "Istanbul",
      country: "Turkey",
      address: "Istanbul, Turkey",
      zipCode: "34000",
    },
    basketItems: [
      {
        id: req.rentalId,
        name: req.basketDescription.substring(0, 100),
        category1: "Arac Kiralama",
        itemType: "PHYSICAL",
        price: toAmount(req.price),
      },
    ],
  };

  const bodyStr = JSON.stringify(body);
  const signature = computeSignature(secretKey, randomString, bodyStr);

  try {
    const response = await fetch(
      `${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `IYZWSv2 apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`,
        },
        body: bodyStr,
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      return {
        success: true,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token,
      };
    }

    return {
      success: false,
      error: result.errorMessage ?? result.errorCode ?? "Bilinmeyen hata",
    };
  } catch (error) {
    console.error("İyzico API hatası:", error);
    return {
      success: false,
      error: "İyzico bağlantı hatası",
    };
  }
}

// ============================================================
// ÖDEME SONUCU DOĞRULA
// ============================================================

export interface PaymentRetrieveResult {
  success: boolean;
  paymentId?: string;
  conversationId?: string;
  paidPrice?: string;
  status?: string;
  error?: string;
}

export async function retrieveCheckoutForm(
  token: string
): Promise<PaymentRetrieveResult> {
  const { apiKey, secretKey, baseUrl } = getConfig();

  const randomString = Math.random().toString(36).substring(2);
  const body = JSON.stringify({ locale: "tr", token });
  const signature = computeSignature(secretKey, randomString, body);

  try {
    const response = await fetch(
      `${baseUrl}/payment/iyzipos/checkoutform/auth/ecom/detail`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `IYZWSv2 apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`,
        },
        body,
      }
    );

    const result = await response.json();

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      return {
        success: true,
        paymentId: result.paymentId,
        conversationId: result.conversationId,
        paidPrice: result.paidPrice,
        status: result.paymentStatus,
      };
    }

    return {
      success: false,
      error: result.errorMessage ?? result.paymentStatus ?? "Ödeme doğrulanamadı",
    };
  } catch (error) {
    console.error("İyzico retrieve hatası:", error);
    return { success: false, error: "Doğrulama hatası" };
  }
}

// Kapsam etiketleri (diğer dosyalardan import edilir)
export const coverageTypeLabels: Record<string, string> = {
  BASIC: "Temel Kasko",
  COMPREHENSIVE: "Tam Kasko",
  PREMIUM: "Premium Kasko",
};

export const policyStatusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  ACTIVE: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  EXPIRED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  SUSPENDED: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  NONE: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};
