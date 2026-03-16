import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { retrieveCheckoutForm } from "@/lib/iyzico";

const APP_URL =
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

// İyzico ödeme sonucu callback'i (POST)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/payment/cancel?reason=no_token`);
    }

    // İyzico'dan ödeme sonucunu doğrula
    const result = await retrieveCheckoutForm(token);

    // Token'a göre payment kaydını bul
    const payment = await db.payment.findFirst({
      where: { iyzicoToken: token },
      include: { rental: true },
    });

    if (!payment) {
      return NextResponse.redirect(`${APP_URL}/payment/cancel?reason=not_found`);
    }

    if (result.success) {
      // Ödeme başarılı — güncelle
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          iyzicoPaymentId: result.paymentId,
          iyzicoResponse: JSON.parse(JSON.stringify(result)),
          paidAt: new Date(),
        },
      });

      await db.rental.update({
        where: { id: payment.rentalId },
        data: { status: "CONFIRMED" },
      });

      // Aracı kiraya ver
      await db.vehicle.update({
        where: { id: payment.rental.vehicleId },
        data: { status: "RENTED" },
      });

      return NextResponse.redirect(
        `${APP_URL}/payment/success?rentalId=${payment.rentalId}`
      );
    } else {
      // Ödeme başarısız
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          iyzicoResponse: JSON.parse(JSON.stringify(result)),
        },
      });

      await db.rental.update({
        where: { id: payment.rentalId },
        data: { status: "CANCELLED" },
      });

      return NextResponse.redirect(
        `${APP_URL}/payment/cancel?reason=${encodeURIComponent(result.error ?? "payment_failed")}`
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(`${APP_URL}/payment/cancel?reason=error`);
  }
}

// GET isteği de destekle (bazı redirect'ler GET ile gelir)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${APP_URL}/payment/cancel`);
  }
  // POST handler'a yönlendir
  const formData = new FormData();
  formData.append("token", token);
  return POST(
    new NextRequest(req.url, { method: "POST", body: formData })
  );
}
