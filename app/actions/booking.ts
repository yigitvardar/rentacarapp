"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCheckoutForm } from "@/lib/iyzico";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  // Paketi ve aracı getir
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
    return { success: false, message: "Geçersiz paket veya araç" };
  }

  if (!tcVerification) {
    return { success: false, message: "Aktif sigorta poliçesi bulunamadı" };
  }

  if (vehicle.status !== "AVAILABLE") {
    return { success: false, message: "Bu araç şu an müsait değil" };
  }

  // Tarihleri hesapla
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + pkg.durationDays);

  // Toplam fiyat = araç günlük fiyat * gün sayısı (paketle overriden olmaz)
  // Paketteki finalPrice kullanılır — araç fiyatı gösterim amaçlı
  const totalPrice = Number(pkg.finalPrice);

  // Kiralama kaydı oluştur (PENDING)
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
    },
  });

  // Ödeme kaydı oluştur
  await db.payment.create({
    data: {
      rentalId: rental.id,
      amount: totalPrice,
      currency: "TRY",
      status: "PENDING",
    },
  });

  // IP adresini al
  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";

  // Callback URL
  const appUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/payment/callback`;

  // İsim / soyisim ayır
  const nameParts = (user.name ?? "Ad Soyad").trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // İyzico checkout form oluştur
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
      identityNumber: tcVerification.tcNumber.replace(/\*/g, "1"),
      ip,
      city: "Istanbul",
      country: "Turkey",
    },
    basketDescription: `${vehicle.brand} ${vehicle.model} - ${pkg.durationDays} Günlük Kiralama`,
  });

  if (!checkoutResult.success) {
    // Başarısız olursa rental'ı iptal et
    await db.rental.update({
      where: { id: rental.id },
      data: { status: "CANCELLED" },
    });
    return {
      success: false,
      message: `Ödeme formu oluşturulamadı: ${checkoutResult.error}`,
    };
  }

  // İyzico token'ını payment'a kaydet
  await db.payment.update({
    where: { rentalId: rental.id },
    data: { iyzicoToken: checkoutResult.token },
  });

  // Ödeme sayfasına yönlendir
  if (checkoutResult.paymentPageUrl) {
    redirect(checkoutResult.paymentPageUrl);
  }

  return {
    success: true,
    checkoutFormContent: checkoutResult.checkoutFormContent,
    paymentPageUrl: checkoutResult.paymentPageUrl,
  };
}
