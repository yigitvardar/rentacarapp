import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { formatDate, formatCurrency } from "@/lib/utils";

// Vercel Cron Job: Her sabah 08:00'de çalışır
// vercel.json cron config ile tetiklenir
export async function GET(req: NextRequest) {
  // Güvenlik: Sadece Vercel Cron veya internal çağrı
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  // Yarın başlayacak kiralamalar
  const upcomingRentals = await db.rental.findMany({
    where: {
      status: { in: ["CONFIRMED", "ACTIVE"] },
      startDate: { gte: tomorrow, lt: dayAfterTomorrow },
    },
    include: { user: true, vehicle: true },
  });

  // Yarın bitecek kiralamalar
  const endingRentals = await db.rental.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: tomorrow, lt: dayAfterTomorrow },
    },
    include: { user: true, vehicle: true },
  });

  let sent = 0;

  for (const rental of upcomingRentals) {
    if (!rental.user.email) continue;
    await sendEmail({
      to: rental.user.email,
      subject: `Yarın başlıyor: ${rental.vehicle.brand} ${rental.vehicle.model}`,
      html: `
        <h2>Kiralama Hatırlatması</h2>
        <p>Merhaba ${rental.user.name},</p>
        <p><strong>${rental.vehicle.brand} ${rental.vehicle.model}</strong> kiralama süreniz <strong>yarın (${formatDate(rental.startDate)})</strong> başlıyor.</p>
        <p><strong>Plaka:</strong> ${rental.vehicle.plate}</p>
        <p><strong>Bitiş:</strong> ${formatDate(rental.endDate)}</p>
        <p><strong>Toplam Tutar:</strong> ${formatCurrency(Number(rental.totalPrice))}</p>
        <p>Teslim almak için TC Kimlik Belgenizi ve Sürücü Belgenizi yanınızda bulundurun.</p>
      `,
    });
    sent++;
  }

  for (const rental of endingRentals) {
    if (!rental.user.email) continue;
    await sendEmail({
      to: rental.user.email,
      subject: `Yarın bitiyor: ${rental.vehicle.brand} ${rental.vehicle.model}`,
      html: `
        <h2>Kiralama Bitiş Hatırlatması</h2>
        <p>Merhaba ${rental.user.name},</p>
        <p><strong>${rental.vehicle.brand} ${rental.vehicle.model}</strong> kiralama süreniz <strong>yarın (${formatDate(rental.endDate)})</strong> sona eriyor.</p>
        <p>Aracı zamanında teslim etmeyi unutmayın. Herhangi bir sorun için destek ekibimizle iletişime geçebilirsiniz.</p>
      `,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, upcoming: upcomingRentals.length, ending: endingRentals.length });
}
