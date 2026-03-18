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

  return { apiKey: apiKey.trim(), secretKey: secretKey.trim(), baseUrl: baseUrl.trim() };
}

// İyzico IYZWSv2 Authorization header üret
// Formül: HMAC-SHA256(randomString + uri + JSON.stringify(body), secretKey) → hex
// Ardından: base64("apiKey:xxx&randomKey:xxx&signature:xxx")
function generateAuthHeader(
  apiKey: string,
  secretKey: string,
  randomString: string,
  uri: string,
  body: object
): string {
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(randomString + uri + JSON.stringify(body))
    .digest("hex");

  const params = `apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(params).toString("base64")}`;
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

  const uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
  const authHeader = generateAuthHeader(apiKey, secretKey, randomString, uri, body);

  try {
    const response = await fetch(`${baseUrl}${uri}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "x-iyzi-rnd": randomString,
        "x-iyzi-client-version": "iyzipay-node-2.0.65",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log("İyzico response:", JSON.stringify(result));

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
      error: `[${result.errorCode}] ${result.errorMessage ?? "Bilinmeyen hata"}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("İyzico API hatası:", msg);
    return {
      success: false,
      error: `Bağlantı hatası: ${msg}`,
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
  const retrieveBody = { locale: "tr", token };
  const retrieveUri = "/payment/iyzipos/checkoutform/auth/ecom/detail";
  const authHeader = generateAuthHeader(apiKey, secretKey, randomString, retrieveUri, retrieveBody);

  try {
    const response = await fetch(`${baseUrl}${retrieveUri}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "x-iyzi-rnd": randomString,
        "x-iyzi-client-version": "iyzipay-node-2.0.65",
      },
      body: JSON.stringify(retrieveBody),
    });

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
