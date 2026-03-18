import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { sendPaymentConfirmationEmail, sendEmail } from "@/lib/email";

function getOrigin(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  return `${proto}://${host}`;
}

// 303 See Other: POST sonrası redirect → tarayıcı GET ile gider
function redirect303(url: string) {
  return NextResponse.redirect(url, { status: 303 });
}

// İyzico ödeme sonucu callback'i (POST)
export async function POST(req: NextRequest) {
  const origin = getOrigin(req);

  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return redirect303(`${origin}/payment/cancel?reason=no_token`);
    }

    // İyzico'dan ödeme sonucunu doğrula
    const result = await retrieveCheckoutForm(token);

    // Token'a göre payment kaydını bul
    const payment = await db.payment.findFirst({
      where: { iyzicoToken: token },
      include: { rental: true },
    });

    if (!payment) {
      return redirect303(`${origin}/payment/cancel?reason=not_found`);
    }

    if (result.success) {
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

      await db.vehicle.update({
        where: { id: payment.rental.vehicleId },
        data: { status: "RENTED" },
      });

      // Onay e-postası gönder (hata olsa da akışı durdurma)
      const rentalWithDetails = await db.rental.findUnique({
        where: { id: payment.rentalId },
        include: { user: true, vehicle: true },
      });
      if (rentalWithDetails?.user.email) {
        await sendPaymentConfirmationEmail({
          to: rentalWithDetails.user.email,
          userName: rentalWithDetails.user.name ?? "Değerli Müşteri",
          rentalId: payment.rentalId,
          vehicleBrand: rentalWithDetails.vehicle.brand,
          vehicleModel: rentalWithDetails.vehicle.model,
          vehiclePlate: rentalWithDetails.vehicle.plate,
          startDate: rentalWithDetails.startDate,
          endDate: rentalWithDetails.endDate,
          totalDays: rentalWithDetails.totalDays,
          totalPrice: Number(rentalWithDetails.totalPrice),
          paymentId: result.paymentId,
        });
      }

      // Admin'e yeni kiralama bildirimi
      try {
        const adminUser = await db.user.findFirst({ where: { role: "ADMIN" } });
        if (adminUser?.email && rentalWithDetails) {
          await sendEmail({
            to: adminUser.email,
            subject: `Yeni Kiralama: ${rentalWithDetails.vehicle.brand} ${rentalWithDetails.vehicle.model}`,
            html: `
              <h2>Yeni Ödeme Alındı</h2>
              <p><strong>Müşteri:</strong> ${rentalWithDetails.user.name} (${rentalWithDetails.user.email})</p>
              <p><strong>Araç:</strong> ${rentalWithDetails.vehicle.brand} ${rentalWithDetails.vehicle.model} — ${rentalWithDetails.vehicle.plate}</p>
              <p><strong>Tarih:</strong> ${rentalWithDetails.startDate.toLocaleDateString("tr-TR")} – ${rentalWithDetails.endDate.toLocaleDateString("tr-TR")}</p>
              <p><strong>Tutar:</strong> ${Number(rentalWithDetails.totalPrice).toLocaleString("tr-TR")} TL</p>
              <p>Onaylamak için <a href="${origin}/admin/rentals">admin panelini</a> ziyaret edin.</p>
            `,
          });
        }
      } catch {}

      return redirect303(`${origin}/payment/success?rentalId=${payment.rentalId}`);
    } else {
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

      return redirect303(
        `${origin}/payment/cancel?reason=${encodeURIComponent(result.error ?? "payment_failed")}`
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return redirect303(`${origin}/payment/cancel?reason=error`);
  }
}

// GET isteği de destekle
export async function GET(req: NextRequest) {
  const origin = getOrigin(req);
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return redirect303(`${origin}/payment/cancel?reason=no_token`);
  }
  const formData = new FormData();
  formData.append("token", token);
  return POST(new NextRequest(req.url, { method: "POST", body: formData }));
}
