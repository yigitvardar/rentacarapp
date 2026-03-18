"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCheckoutForm } from "@/lib/iyzico";
import { headers } from "next/headers";

const bookingSchema = z.object({
  packageId: z.string().min(1),
  vehicleId: z.string().min(1),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Geçerli bir başlangıç tarihi girin",
  }),
});

export type BookingState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
};

export async function createBookingAction(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Oturum açmanız gerekiyor" };
    }

    const raw = {
      packageId: formData.get("packageId") as string,
      vehicleId: formData.get("vehicleId") as string,
      startDate: formData.get("startDate") as string,
    };

    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { packageId, vehicleId, startDate } = parsed.data;

    const [pkg, vehicle, user, tcVerification] = await Promise.all([
      db.rentalPackage.findUnique({ where: { id: packageId }, include: { category: true } }),
      db.vehicle.findUnique({ where: { id: vehicleId } }),
      db.user.findUnique({ where: { id: session.user.id } }),
      db.tcVerification.findFirst({
        where: { userId: session.user.id, policyStatus: "ACTIVE" },
        orderBy: { verifiedAt: "desc" },
      }),
    ]);

    if (!pkg || !vehicle || !user) {
      return { success: false, message: "Geçersiz paket veya araç bilgisi" };
    }
    if (!tcVerification) {
      return { success: false, message: "Aktif sigorta poliçesi bulunamadı" };
    }
    if (vehicle.status !== "AVAILABLE") {
      return { success: false, message: "Bu araç şu an müsait değil" };
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + pkg.durationDays);

    // Çakışan kiralama kontrolü
    const conflict = await db.rental.findFirst({
      where: {
        vehicleId,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (conflict) {
      return { success: false, message: "Bu araç seçilen tarihler arasında müsait değil. Lütfen farklı tarih veya araç seçin." };
    }
    // İndirim kodu kontrolü
    const discountCodeStr = (formData.get("discountCode") as string | null)?.toUpperCase().trim() || null;
    let totalPrice = Number(pkg.finalPrice);
    let discountAmount = 0;

    if (discountCodeStr) {
      const discountRecord = await db.discountCode.findUnique({ where: { code: discountCodeStr } });
      if (
        discountRecord &&
        discountRecord.isActive &&
        (!discountRecord.expiresAt || discountRecord.expiresAt > new Date()) &&
        (!discountRecord.maxUses || discountRecord.usedCount < discountRecord.maxUses)
      ) {
        discountAmount = Math.round(totalPrice * Number(discountRecord.discountPercent) / 100);
        totalPrice = totalPrice - discountAmount;
        // Kullanım sayısını artır
        await db.discountCode.update({ where: { code: discountCodeStr }, data: { usedCount: { increment: 1 } } });
      }
    }

    // Kiralama ve ödeme kaydı oluştur
    const rental = await db.rental.create({
      data: {
        userId: session.user.id,
        vehicleId,
        packageId,
        tcNumber: tcVerification.tcNumber,
        startDate: start,
        endDate: end,
        totalDays: pkg.durationDays,
        totalPrice,
        status: "PENDING",
        ...(discountCodeStr && discountAmount > 0 ? { discountCode: discountCodeStr, discountAmount } : {}),
      },
    });

    await db.payment.create({
      data: {
        rentalId: rental.id,
        amount: totalPrice,
        currency: "TRY",
        status: "PENDING",
      },
    });

    // IP ve callback URL
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
    const proto = headersList.get("x-forwarded-proto")?.split(",")[0].trim() ?? "http";
    const callbackUrl = `${proto}://${host}/api/payment/callback`;

    const nameParts = (user.name ?? "Ad Soyad").trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // İyzico checkout form
    const checkoutResult = await createCheckoutForm({
      conversationId: rental.id,
      rentalId: rental.id,
      price: totalPrice,
      paidPrice: totalPrice,
      callbackUrl,
      buyer: {
        id: session.user.id,
        name: firstName,
        surname: lastName,
        email: user.email!,
        identityNumber: "11111111111",
        ip,
        city: "Istanbul",
        country: "Turkey",
      },
      basketDescription: `${vehicle.brand} ${vehicle.model} - ${pkg.durationDays} Günlük Kiralama`,
    });

    if (!checkoutResult.success) {
      await db.rental.update({ where: { id: rental.id }, data: { status: "CANCELLED" } });
      return {
        success: false,
        message: `Ödeme formu oluşturulamadı: ${checkoutResult.error}`,
      };
    }

    // Token kaydet
    await db.payment.update({
      where: { rentalId: rental.id },
      data: { iyzicoToken: checkoutResult.token },
    });

    // redirect() KULLANMIYORUZ — client tarafı yönlendirecek
    return {
      success: true,
      paymentPageUrl: checkoutResult.paymentPageUrl,
      checkoutFormContent: checkoutResult.checkoutFormContent,
    };
  } catch (error) {
    console.error("Booking action error:", error);
    return {
      success: false,
      message: "Rezervasyon oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}
