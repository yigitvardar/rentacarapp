import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { formatDate, formatCurrency } from "@/lib/utils";

// Vercel Cron Job: Her gece 02:00'de çalışır
// endDate geçmiş ACTIVE kiralamalar → COMPLETED
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expiredRentals = await db.rental.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
    include: { user: true, vehicle: true },
  });

  let completed = 0;

  for (const rental of expiredRentals) {
    await db.$transaction([
      db.rental.update({
        where: { id: rental.id },
        data: { status: "COMPLETED" },
      }),
      db.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: "AVAILABLE" },
      }),
    ]);

    if (rental.user.email) {
      await sendEmail({
        to: rental.user.email,
        subject: `Kiralamanz Tamamlandı — ${rental.vehicle.brand} ${rental.vehicle.model}`,
        html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #2563eb; padding: 32px; text-align: center;">
      <span style="font-size: 40px;">🏁</span>
      <h1 style="color: white; margin: 12px 0 0; font-size: 22px; font-weight: 700;">Kiralama Tamamlandı</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">
        Merhaba <strong>${rental.user.name}</strong>, <strong>${rental.vehicle.brand} ${rental.vehicle.model}</strong> kiralama süreniz tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz!
      </p>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; font-size: 14px;">
        <p style="color: #1e40af; font-weight: 600; margin: 0 0 12px;">Kiralama Özeti</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color:#6b7280;padding:6px 0;">Araç</td><td style="color:#111827;font-weight:600;text-align:right;">${rental.vehicle.brand} ${rental.vehicle.model}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Plaka</td><td style="color:#111827;font-weight:600;text-align:right;font-family:monospace;">${rental.vehicle.plate}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Başlangıç</td><td style="color:#111827;font-weight:600;text-align:right;">${formatDate(rental.startDate)}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Bitiş</td><td style="color:#111827;font-weight:600;text-align:right;">${formatDate(rental.endDate)}</td></tr>
          <tr style="border-top:1px solid #bfdbfe;">
            <td style="color:#1e40af;padding:10px 0 0;font-weight:600;">Toplam Ödenen</td>
            <td style="color:#1e40af;font-weight:700;text-align:right;font-size:16px;">${formatCurrency(Number(rental.totalPrice))}</td>
          </tr>
        </table>
      </div>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Araç Kiralama — Sigorta Destekli Hizmet</p>
    </div>
  </div>
</body>
</html>`,
      });
    }

    completed++;
  }

  return NextResponse.json({ ok: true, completed });
}
