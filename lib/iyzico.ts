/**
 * İyzico Ödeme Servisi
 *
 * Sandbox test: https://sandbox-api.iyzipay.com
 * Canlı:        https://api.iyzipay.com
 *
 * Test kartları: https://docs.iyzico.com/sandbox/test-cards
 * 4506 3490 0000 0006 — Başarılı ödeme
 * 4508 0348 1005 0003 — Başarısız ödeme
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require("iyzipay");

// İyzico istemcisi (singleton)
let _iyzico: typeof Iyzipay | null = null;

function getIyzico() {
  if (!_iyzico) {
    _iyzico = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY ?? "sandbox-api-key",
      secretKey: process.env.IYZICO_SECRET_KEY ?? "sandbox-secret-key",
      uri: process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com",
    });
  }
  return _iyzico;
}

// Tutarı İyzico formatına çevir (string, 2 ondalık)
export function toIyzicoAmount(amount: number): string {
  return amount.toFixed(2);
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
    identityNumber: string; // TC veya pasaport
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
  const iyzico = getIyzico();

  const request = {
    locale: "tr",
    conversationId: req.conversationId,
    price: toIyzicoAmount(req.price),
    paidPrice: toIyzicoAmount(req.paidPrice),
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
      identityNumber: "11111111111", // sandbox için sabit
      registrationAddress: `${req.buyer.city}, ${req.buyer.country}`,
      ip: req.buyer.ip,
      city: req.buyer.city,
      country: req.buyer.country,
    },
    shippingAddress: {
      contactName: `${req.buyer.name} ${req.buyer.surname}`,
      city: req.buyer.city,
      country: req.buyer.country,
      address: `${req.buyer.city}, ${req.buyer.country}`,
    },
    billingAddress: {
      contactName: `${req.buyer.name} ${req.buyer.surname}`,
      city: req.buyer.city,
      country: req.buyer.country,
      address: `${req.buyer.city}, ${req.buyer.country}`,
    },
    basketItems: [
      {
        id: req.rentalId,
        name: req.basketDescription,
        category1: "Araç Kiralama",
        itemType: "PHYSICAL",
        price: toIyzicoAmount(req.price),
      },
    ],
  };

  return new Promise((resolve) => {
    iyzico.checkoutFormInitialize.create(
      request,
      (err: Error | null, result: Record<string, string>) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }
        if (result.status === "success") {
          resolve({
            success: true,
            checkoutFormContent: result.checkoutFormContent,
            paymentPageUrl: result.paymentPageUrl,
            token: result.token,
          });
        } else {
          resolve({
            success: false,
            error: result.errorMessage ?? "Ödeme formu oluşturulamadı",
          });
        }
      }
    );
  });
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
  const iyzico = getIyzico();

  return new Promise((resolve) => {
    iyzico.checkoutForm.retrieve(
      { locale: "tr", token },
      (err: Error | null, result: Record<string, string>) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }
        if (result.status === "success" && result.paymentStatus === "SUCCESS") {
          resolve({
            success: true,
            paymentId: result.paymentId,
            conversationId: result.conversationId,
            paidPrice: result.paidPrice,
            status: result.paymentStatus,
          });
        } else {
          resolve({
            success: false,
            error: result.errorMessage ?? result.paymentStatus ?? "Ödeme başarısız",
          });
        }
      }
    );
  });
}
